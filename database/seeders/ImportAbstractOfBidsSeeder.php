<?php

namespace Database\Seeders;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ImportAbstractOfBidsSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = base_path('database/data/abstract_of_bids_raw.csv');
        if (! file_exists($csvPath)) {
            $this->command->error("CSV file not found at: {$csvPath}");

            return;
        }

        $handle = fopen($csvPath, 'r');
        if (! $handle) {
            $this->command->error('Could not open CSV file.');

            return;
        }

        // Disable foreign key checks to wipe existing catalog data cleanly
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('item_bidder')->truncate();
        DB::table('items')->truncate();
        DB::table('categories')->truncate();
        DB::table('bidders')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create Medical Supplies Category
        $category = Category::create([
            'name' => 'Medical Supplies',
            'cat_code' => 'medical-supplies',
            'description' => 'Medical consumables and hospital supplies.',
        ]);

        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            $rows[] = $data;
        }
        fclose($handle);

        $this->command->info('Loaded '.count($rows).' raw lines from CSV.');

        $cleanNumber = function ($val) {
            if ($val === null) {
                return null;
            }
            $val = trim((string) $val);
            if ($val === '' || strtoupper($val) === 'NO BID' || strtoupper($val) === 'NO BIDDER') {
                return null;
            }
            $val = str_replace([',', '"', '₱', ' '], '', $val);

            return is_numeric($val) ? (float) $val : null;
        };

        $cleanText = function ($val) {
            if ($val === null) {
                return '';
            }
            $val = trim((string) $val);

            return trim($val, "\"' \t\n\r\0\x0B");
        };

        // Group rows by item
        $itemsData = [];
        $currentItem = null;

        foreach ($rows as $row) {
            if (empty(array_filter($row, fn ($c) => trim((string) $c) !== ''))) {
                continue;
            }

            $firstCol = trim($row[0] ?? '');
            if (is_numeric($firstCol)) {
                if ($currentItem !== null) {
                    $itemsData[] = $currentItem;
                }
                $currentItem = [
                    'item_no' => (int) $firstCol,
                    'description' => $cleanText($row[1] ?? ''),
                    'qty' => $cleanNumber($row[2] ?? 1) ?? 1,
                    'unit' => $cleanText($row[3] ?? 'pc'),
                    'unit_cost' => $cleanNumber($row[4] ?? 0) ?? 0,
                    'abc' => $cleanNumber($row[5] ?? 0) ?? 0,
                    'rank_cells' => array_slice($row, 6),
                    'extra_lines' => [],
                ];
            } elseif ($currentItem !== null) {
                $currentItem['extra_lines'][] = array_slice($row, 6);
            }
        }

        if ($currentItem !== null) {
            $itemsData[] = $currentItem;
        }

        $this->command->info('Parsed '.count($itemsData).' distinct items.');

        $bidderCache = [];
        $bidderCodeCounter = 1;

        $getOrCreateBidder = function ($name, $location = '') use (&$bidderCache, &$bidderCodeCounter, $cleanText) {
            $name = $cleanText($name);
            if (empty($name) || strtoupper($name) === 'NO BID' || strtoupper($name) === 'NO BIDDER') {
                return null;
            }

            if (isset($bidderCache[$name])) {
                if (! empty($location) && empty($bidderCache[$name]->location)) {
                    $bidderCache[$name]->update([
                        'location' => $cleanText($location),
                        'address' => $cleanText($location),
                    ]);
                }

                return $bidderCache[$name];
            }

            $code = 'BDR-'.str_pad((string) $bidderCodeCounter++, 3, '0', STR_PAD_LEFT);
            $bidder = Bidder::firstOrCreate(
                ['name' => $name],
                [
                    'bidder_code' => $code,
                    'location' => $cleanText($location) ?: null,
                    'address' => $cleanText($location) ?: null,
                ]
            );

            if (! empty($location) && empty($bidder->location)) {
                $bidder->update([
                    'location' => $cleanText($location),
                    'address' => $cleanText($location),
                ]);
            }

            $bidderCache[$name] = $bidder;

            return $bidder;
        };

        $totalItemsCreated = 0;
        $totalBidsAttached = 0;

        foreach ($itemsData as $itemInfo) {
            $itemNo = $itemInfo['item_no'];
            $fullDesc = $itemInfo['description'];
            $qty = $itemInfo['qty'] > 0 ? $itemInfo['qty'] : 1;
            $unit = ! empty($itemInfo['unit']) ? $itemInfo['unit'] : 'pc';
            $unitCost = $itemInfo['unit_cost'];
            $abc = $itemInfo['abc'] > 0 ? $itemInfo['abc'] : ($unitCost * $qty);

            // Extract item name and description
            $parts = explode(',', $fullDesc, 2);
            $name = trim($parts[0] ?? "Item {$itemNo}");
            if (strlen($name) > 250) {
                $name = substr($name, 0, 247).'...';
            }
            $description = $fullDesc;

            $itemCode = 'MED-'.str_pad((string) $itemNo, 3, '0', STR_PAD_LEFT);

            $item = Item::create([
                'item_code' => $itemCode,
                'name' => $name,
                'description' => $description,
                'unit_type' => $unit,
                'unit_cost' => $unitCost,
                'quantity' => $qty,
                'abc' => $abc,
                'category_id' => $category->id,
            ]);

            $totalItemsCreated++;

            $colCount = max(count($itemInfo['rank_cells']), 5);

            for ($col = 0; $col < $colCount; $col++) {
                $colValues = [];
                if (isset($itemInfo['rank_cells'][$col])) {
                    $val = $cleanText($itemInfo['rank_cells'][$col]);
                    if ($val !== '') {
                        $colValues[] = $val;
                    }
                }
                foreach ($itemInfo['extra_lines'] as $extra) {
                    if (isset($extra[$col])) {
                        $val = $cleanText($extra[$col]);
                        if ($val !== '') {
                            $colValues[] = $val;
                        }
                    }
                }

                if (empty($colValues)) {
                    continue;
                }

                $p = 0;
                $len = count($colValues);

                while ($p < $len) {
                    $token = $colValues[$p];
                    if (strtoupper($token) === 'NO BID' || strtoupper($token) === 'NO BIDDER') {
                        $p++;

                        continue;
                    }

                    $numVal = $cleanNumber($token);

                    if ($numVal !== null && $numVal > 0) {
                        // Found price
                        $totalPrice = $numVal;
                        $p++;
                        $bidderName = '';
                        $bidderLocation = '';

                        if ($p < $len && $cleanNumber($colValues[$p]) === null && strtoupper($colValues[$p]) !== 'NO BID') {
                            $bidderName = $colValues[$p];
                            $p++;

                            if ($p < $len && $cleanNumber($colValues[$p]) === null && strtoupper($colValues[$p]) !== 'NO BID') {
                                $bidderLocation = $colValues[$p];
                                $p++;
                            }
                        }

                        if (! empty($bidderName)) {
                            $bidder = $getOrCreateBidder($bidderName, $bidderLocation);
                            if ($bidder) {
                                $bidUnitCost = $qty > 0 ? ($totalPrice / $qty) : $totalPrice;
                                $item->bidders()->syncWithoutDetaching([
                                    $bidder->id => [
                                        'unit_cost' => $bidUnitCost,
                                    ],
                                ]);
                                $totalBidsAttached++;
                            }
                        }
                    } else {
                        // Token might be a name without preceding price on same row
                        $bidderName = $token;
                        $p++;
                        $bidderLocation = '';
                        if ($p < $len && $cleanNumber($colValues[$p]) === null && strtoupper($colValues[$p]) !== 'NO BID') {
                            $bidderLocation = $colValues[$p];
                            $p++;
                        }
                        if (! empty($bidderName)) {
                            $bidder = $getOrCreateBidder($bidderName, $bidderLocation);
                            if ($bidder) {
                                $item->bidders()->syncWithoutDetaching([
                                    $bidder->id => [
                                        'unit_cost' => $unitCost,
                                    ],
                                ]);
                                $totalBidsAttached++;
                            }
                        }
                    }
                }
            }
        }

        $this->command->info('=== Abstract of Bids Import Summary ===');
        $this->command->info('Categories created: 1');
        $this->command->info('Bidders registered: '.count($bidderCache));
        $this->command->info("Items inserted: {$totalItemsCreated}");
        $this->command->info("Bidder bids attached: {$totalBidsAttached}");
    }
}
