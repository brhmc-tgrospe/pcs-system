<?php

namespace App\Services;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ItemImportService
{
    /**
     * Required CSV columns (normalized to lowercase).
     */
    protected const REQUIRED_COLUMNS = [
        'category code',
        'name',
        'description',
        'unit type',
        'baseline unit cost',
        'quantity',
    ];

    /**
     * Map of normalized lowercase status strings to canonical Model statuses.
     */
    protected const STATUS_MAP = [
        'active' => Item::STATUS_ACTIVE,
        'no bid' => Item::STATUS_NO_BID,
        'pending award' => Item::STATUS_PENDING_AWARD,
        'failed bid' => Item::STATUS_FAILED_BID,
        'awarded' => Item::STATUS_AWARDED,
        'closed' => Item::STATUS_CLOSED,
    ];

    /**
     * Import or update items from an uploaded CSV file.
     *
     * @return array{added: int, updated: int, errors: array<int, string>}
     */
    public function import(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if (! $handle) {
            throw new Exception('Could not open the uploaded CSV file.');
        }

        // Line 1: Header row
        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);
            throw new Exception('The uploaded CSV file is empty or invalid.');
        }

        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = strtolower(trim((string) $col));
            $headerMap[$normalized] = $index;
        }

        foreach (self::REQUIRED_COLUMNS as $reqCol) {
            if (! isset($headerMap[$reqCol])) {
                fclose($handle);
                throw new Exception("Missing required column in CSV header: '{$reqCol}'");
            }
        }

        $statusColIndex = $headerMap['status'] ?? null;
        $biddersColIndex = $headerMap['bidders'] ?? null;
        $awardedBidderColIndex = $headerMap['awarded bidder'] ?? null;

        // Line 2: Unconditionally discard the template hint/example row
        fgetcsv($handle);

        $addedCount = 0;
        $updatedCount = 0;
        $errors = [];
        $lineNumber = 2; // Line 1 header, line 2 hint row; data begins at line 3

        // Preload lookups for performance and case-insensitivity
        // Categories: lowercase cat_code => category_id
        $categories = Category::all()->mapWithKeys(function ($cat) {
            return [strtolower(trim((string) $cat->cat_code)) => $cat->id];
        })->toArray();

        // Bidders: uppercase bidder_code => bidder_id
        $bidders = Bidder::all()->mapWithKeys(function ($b) {
            return [strtoupper(trim((string) $b->bidder_code)) => $b->id];
        })->toArray();

        // Existing active items keyed by category_id (1 item per category)
        $existingItems = Item::whereNull('deleted_at')
            ->get()
            ->keyBy('category_id');

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            // Skip completely empty rows
            if (empty(array_filter($row, fn ($val) => trim((string) $val) !== ''))) {
                continue;
            }

            try {
                DB::beginTransaction();

                $rawCatCode = trim((string) ($row[$headerMap['category code']] ?? ''));
                $name = trim((string) ($row[$headerMap['name']] ?? ''));
                $description = trim((string) ($row[$headerMap['description']] ?? ''));
                $unitType = trim((string) ($row[$headerMap['unit type']] ?? ''));
                $unitCost = trim((string) ($row[$headerMap['baseline unit cost']] ?? ''));
                $quantity = trim((string) ($row[$headerMap['quantity']] ?? ''));
                $rawStatus = $statusColIndex !== null ? trim((string) ($row[$statusColIndex] ?? '')) : '';
                $biddersStr = $biddersColIndex !== null ? trim((string) ($row[$biddersColIndex] ?? '')) : '';
                $rawAwardedBidder = $awardedBidderColIndex !== null ? trim((string) ($row[$awardedBidderColIndex] ?? '')) : '';

                // Required Field Validations
                if ($rawCatCode === '') {
                    throw new Exception("Missing 'Category Code' on line {$lineNumber}.");
                }
                if ($name === '') {
                    throw new Exception("Missing 'Name' on line {$lineNumber}.");
                }
                if ($unitType === '') {
                    throw new Exception("Missing 'Unit Type' on line {$lineNumber}.");
                }
                if (! is_numeric($unitCost) || (float) $unitCost < 0) {
                    throw new Exception("Invalid 'Baseline Unit Cost' ('{$unitCost}') on line {$lineNumber}. Must be a positive number.");
                }
                if (! is_numeric($quantity) || (float) $quantity < 1) {
                    throw new Exception("Invalid 'Quantity' ('{$quantity}') on line {$lineNumber}. Must be an integer >= 1.");
                }

                $catCodeLower = strtolower($rawCatCode);
                $categoryId = $categories[$catCodeLower] ?? null;
                if (! $categoryId) {
                    throw new Exception("Category Code '{$rawCatCode}' not found on line {$lineNumber}.");
                }

                // Awarded Bidder & Status resolution (case-insensitive)
                $awardedBidderId = null;
                $finalStatus = Item::STATUS_ACTIVE;

                if ($rawAwardedBidder !== '') {
                    $bidderCodeUpper = strtoupper($rawAwardedBidder);
                    if (! isset($bidders[$bidderCodeUpper])) {
                        throw new Exception("Awarded Bidder Code '{$rawAwardedBidder}' not found on line {$lineNumber}.");
                    }
                    $awardedBidderId = $bidders[$bidderCodeUpper];
                    // Unconditional override: Awarded Bidder data present always sets status to Awarded
                    $finalStatus = Item::STATUS_AWARDED;
                } else {
                    // Fallback to Status column when Awarded Bidder is empty
                    if ($rawStatus !== '') {
                        $statusLower = strtolower($rawStatus);
                        if (! isset(self::STATUS_MAP[$statusLower])) {
                            $validOptions = implode(', ', array_values(self::STATUS_MAP));
                            throw new Exception("Invalid Status '{$rawStatus}' on line {$lineNumber}. Valid options: {$validOptions}.");
                        }
                        $finalStatus = self::STATUS_MAP[$statusLower];
                        if ($finalStatus === Item::STATUS_AWARDED) {
                            throw new Exception("Status is 'Awarded' on line {$lineNumber}, but no Awarded Bidder was specified.");
                        }
                    } else {
                        $finalStatus = Item::STATUS_ACTIVE;
                    }
                }

                // Parse Bidders quotations
                $syncData = [];
                if ($biddersStr !== '') {
                    $bidderEntries = explode(',', $biddersStr);
                    foreach ($bidderEntries as $entry) {
                        $parts = explode(':', $entry);
                        if (count($parts) !== 2) {
                            throw new Exception("Invalid Bidders format '{$entry}' on line {$lineNumber}. Expected 'BidderCode:UnitCost'.");
                        }

                        $bCodeUpper = strtoupper(trim($parts[0]));
                        $bCost = trim($parts[1]);

                        if (! isset($bidders[$bCodeUpper])) {
                            throw new Exception("Bidder Code '{$bCodeUpper}' not found in quotations on line {$lineNumber}.");
                        }

                        if (! is_numeric($bCost) || (float) $bCost < 0) {
                            throw new Exception("Invalid Unit Cost '{$bCost}' for Bidder '{$bCodeUpper}' on line {$lineNumber}.");
                        }

                        $bidderId = $bidders[$bCodeUpper];
                        $syncData[$bidderId] = ['unit_cost' => $bCost];
                    }
                }

                // If awarded bidder specified, ensure it is linked in the bidders quotation list
                if ($awardedBidderId !== null && ! isset($syncData[$awardedBidderId])) {
                    $syncData[$awardedBidderId] = ['unit_cost' => $unitCost];
                }

                $abc = round((float) $unitCost * (float) $quantity, 2);

                // Check if an item already exists under this Category Code
                $existingItem = $existingItems->get($categoryId);

                if ($existingItem) {
                    // Update existing item
                    $existingItem->update([
                        'name' => $name,
                        'description' => $description,
                        'unit_type' => $unitType,
                        'unit_cost' => $unitCost,
                        'quantity' => $quantity,
                        'abc' => $abc,
                        'status' => $finalStatus,
                        'awarded_bidder_id' => $awardedBidderId,
                    ]);

                    $existingItem->bidders()->sync($syncData);
                    $updatedCount++;
                } else {
                    // Create new item with a generated unique code
                    do {
                        $code = strtoupper(Str::random(3)).'-'.mt_rand(100, 999);
                    } while (Item::where('item_code', $code)->exists());

                    $newItem = Item::create([
                        'item_code' => $code,
                        'name' => $name,
                        'description' => $description,
                        'unit_type' => $unitType,
                        'unit_cost' => $unitCost,
                        'quantity' => $quantity,
                        'abc' => $abc,
                        'category_id' => $categoryId,
                        'status' => $finalStatus,
                        'awarded_bidder_id' => $awardedBidderId,
                    ]);

                    if (! empty($syncData)) {
                        $newItem->bidders()->sync($syncData);
                    }

                    // Register into existingItems map so any subsequent duplicate rows in the same CSV will update this item
                    $existingItems->put($categoryId, $newItem);
                    $addedCount++;
                }

                DB::commit();
            } catch (Exception $e) {
                DB::rollBack();
                $errors[] = $e->getMessage();
            }
        }

        fclose($handle);

        return [
            'added' => $addedCount,
            'updated' => $updatedCount,
            'errors' => $errors,
        ];
    }
}
