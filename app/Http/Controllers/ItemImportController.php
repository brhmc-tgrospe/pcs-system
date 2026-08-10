<?php
namespace App\Http\Controllers;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class ItemImportController extends Controller
{
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'], // 5MB max
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        if (!$handle) {
            return back()->with('error', 'Could not open the uploaded file.');
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header) {
            return back()->with('error', 'The uploaded file is empty or invalid.');
        }

        // Normalize header for mapping
        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = strtolower(trim($col));
            $headerMap[$normalized] = $index;
        }

        $requiredColumns = ['category code', 'name', 'description', 'unit type', 'baseline unit cost', 'quantity'];
        
        foreach ($requiredColumns as $reqCol) {
            if (!isset($headerMap[$reqCol])) {
                return back()->with('error', "Missing required column in CSV header: '{$reqCol}'");
            }
        }

        $biddersColIndex = $headerMap['bidders'] ?? null;

        $importedCount = 0;
        $errors = [];
        $lineNumber = 1; // Header is line 1

        // Preload categories and bidders for performance and quick lookup
        $categories = Category::pluck('id', 'cat_code')->toArray();
        $bidders = Bidder::pluck('id', 'bidder_code')->toArray();

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            try {
                DB::beginTransaction();

                $catCode = trim($row[$headerMap['category code']] ?? '');
                $name = trim($row[$headerMap['name']] ?? '');
                $description = trim($row[$headerMap['description']] ?? '');
                $unitType = trim($row[$headerMap['unit type']] ?? '');
                $unitCost = trim($row[$headerMap['baseline unit cost']] ?? '');
                $quantity = trim($row[$headerMap['quantity']] ?? '');
                $biddersStr = $biddersColIndex !== null ? trim($row[$biddersColIndex] ?? '') : '';

                // Validation
                if (empty($catCode)) {
                    throw new Exception("Missing 'Category Code' on line {$lineNumber}.");
                }
                if (empty($name)) {
                    throw new Exception("Missing 'Name' on line {$lineNumber}.");
                }
                if (empty($unitType)) {
                    throw new Exception("Missing 'Unit Type' on line {$lineNumber}.");
                }
                if (!is_numeric($unitCost) || $unitCost < 0) {
                    throw new Exception("Invalid 'Baseline Unit Cost' ('{$unitCost}') on line {$lineNumber}. Must be a positive number.");
                }
                if (!is_numeric($quantity) || $quantity < 1) {
                    throw new Exception("Invalid 'Quantity' ('{$quantity}') on line {$lineNumber}. Must be a positive integer >= 1.");
                }

                $categoryId = $categories[$catCode] ?? null;
                if (!$categoryId) {
                    throw new Exception("Category Code '{$catCode}' not found on line {$lineNumber}.");
                }

                // Parse Bidders
                $syncData = [];
                if (!empty($biddersStr)) {
                    // Format: BDR-123: 150.00, BDR-456: 145.50
                    $bidderEntries = explode(',', $biddersStr);
                    foreach ($bidderEntries as $entry) {
                        $parts = explode(':', $entry);
                        if (count($parts) !== 2) {
                            throw new Exception("Invalid Bidders format '{$entry}' on line {$lineNumber}. Expected 'BidderCode:UnitCost'.");
                        }
                        
                        $bCode = trim($parts[0]);
                        $bCost = trim($parts[1]);

                        if (!isset($bidders[$bCode])) {
                            throw new Exception("Bidder Code '{$bCode}' not found on line {$lineNumber}.");
                        }

                        if (!is_numeric($bCost) || $bCost < 0) {
                            throw new Exception("Invalid Unit Cost '{$bCost}' for Bidder '{$bCode}' on line {$lineNumber}.");
                        }

                        $bidderId = $bidders[$bCode];
                        $syncData[$bidderId] = ['unit_cost' => $bCost];
                    }
                }

                // Generate random item code
                do {
                    $code = strtoupper(Str::random(3)) . '-' . mt_rand(100, 999);
                } while (Item::where('item_code', $code)->exists());

                $item = Item::create([
                    'item_code' => $code,
                    'name' => $name,
                    'description' => $description,
                    'unit_type' => $unitType,
                    'unit_cost' => $unitCost,
                    'quantity' => $quantity,
                    'abc' => $unitCost * $quantity,
                    'category_id' => $categoryId,
                ]);

                if (!empty($syncData)) {
                    $item->bidders()->sync($syncData);
                }

                DB::commit();
                $importedCount++;
            } catch (Exception $e) {
                DB::rollBack();
                $errors[] = $e->getMessage();
            }
        }

        fclose($handle);

        if (count($errors) > 0) {
            $errorMsg = "Imported {$importedCount} items, but encountered " . count($errors) . " errors.";
            return back()->with('success', $errorMsg)->with('import_errors', $errors);
        }

        return back()->with('success', "Successfully imported {$importedCount} items.");
    }
}
