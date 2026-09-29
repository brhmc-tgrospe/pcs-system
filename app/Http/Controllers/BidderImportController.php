<?php
namespace App\Http\Controllers;

use App\Models\Bidder;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Exception;

class BidderImportController extends Controller
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
            fclose($handle);
            return back()->with('error', 'The uploaded file is empty or invalid.');
        }

        // Normalize header for mapping
        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = str_replace(['_', '-'], ' ', strtolower(trim($col)));
            $headerMap[$normalized] = $index;
        }

        // Find matching columns
        $codeColIndex = $headerMap['bidder code'] ?? $headerMap['code'] ?? $headerMap['bidder_code'] ?? null;
        $nameColIndex = $headerMap['bidder name'] ?? $headerMap['name'] ?? $headerMap['company name'] ?? $headerMap['company / bidder name'] ?? null;
        $contactPersonColIndex = $headerMap['contact person'] ?? $headerMap['contact_person'] ?? null;
        $contactNumberColIndex = $headerMap['contact number'] ?? $headerMap['contact_number'] ?? $headerMap['phone'] ?? $headerMap['contact'] ?? null;
        $emailColIndex = $headerMap['email'] ?? null;
        $addressColIndex = $headerMap['address'] ?? null;
        $locationColIndex = $headerMap['location'] ?? $headerMap['city'] ?? $headerMap['province'] ?? null;
        $brandNameColIndex = $headerMap['brand name'] ?? $headerMap['brand'] ?? $headerMap['brand_name'] ?? null;
        $originColIndex = $headerMap['country of origin'] ?? $headerMap['origin'] ?? $headerMap['country_of_origin'] ?? null;

        if ($codeColIndex === null) {
            fclose($handle);
            return back()->with('error', "Missing required column in CSV header: 'Bidder Code'");
        }

        if ($nameColIndex === null) {
            fclose($handle);
            return back()->with('error', "Missing required column in CSV header: 'Bidder Name' (or 'Name')");
        }

        $importedCount = 0;
        $errors = [];
        $lineNumber = 1; // Header is line 1

        // Preload existing bidder codes
        $existingCodes = Bidder::withTrashed()->pluck('id', 'bidder_code')->toArray();
        $batchCodes = [];

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            try {
                DB::beginTransaction();

                $bidderCode = trim($row[$codeColIndex] ?? '');
                $name = trim($row[$nameColIndex] ?? '');
                $contactPerson = $contactPersonColIndex !== null ? trim($row[$contactPersonColIndex] ?? '') : null;
                $contactNumber = $contactNumberColIndex !== null ? trim($row[$contactNumberColIndex] ?? '') : null;
                $email = $emailColIndex !== null ? trim($row[$emailColIndex] ?? '') : null;
                $address = $addressColIndex !== null ? trim($row[$addressColIndex] ?? '') : null;
                $location = $locationColIndex !== null ? trim($row[$locationColIndex] ?? '') : null;
                $brandName = $brandNameColIndex !== null ? trim($row[$brandNameColIndex] ?? '') : null;
                $origin = $originColIndex !== null ? trim($row[$originColIndex] ?? '') : null;

                // If brand/origin not explicitly given but location is, handle comma split if present
                if (empty($brandName) && empty($origin) && !empty($location) && str_contains($location, ',')) {
                    $parts = array_map('trim', explode(',', $location, 2));
                    $brandName = $parts[0] ?? null;
                    $origin = $parts[1] ?? null;
                }

                // Validation
                if (empty($bidderCode)) {
                    throw new Exception("Missing 'Bidder Code' on line {$lineNumber}.");
                }
                if (empty($name)) {
                    throw new Exception("Missing 'Bidder Name' on line {$lineNumber}.");
                }

                if (isset($existingCodes[$bidderCode])) {
                    throw new Exception("Bidder Code '{$bidderCode}' already exists in database (line {$lineNumber}).");
                }

                if (isset($batchCodes[$bidderCode])) {
                    throw new Exception("Duplicate Bidder Code '{$bidderCode}' found in CSV on line {$lineNumber}.");
                }

                if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception("Invalid email format '{$email}' on line {$lineNumber}.");
                }

                Bidder::create([
                    'bidder_code' => $bidderCode,
                    'name' => $name,
                    'contact_person' => $contactPerson ?: null,
                    'contact_number' => $contactNumber ?: null,
                    'email' => $email ?: null,
                    'address' => $address ?: null,
                    'location' => $location ?: null,
                    'brand_name' => $brandName ?: null,
                    'country_of_origin' => $origin ?: null,
                ]);

                DB::commit();
                $existingCodes[$bidderCode] = true;
                $batchCodes[$bidderCode] = true;
                $importedCount++;
            } catch (Exception $e) {
                DB::rollBack();
                $errors[] = $e->getMessage();
            }
        }

        fclose($handle);

        if (count($errors) > 0) {
            $errorMsg = "Imported {$importedCount} bidders, but encountered " . count($errors) . " errors.";
            return back()->with('success', $errorMsg)->with('import_errors', $errors);
        }

        return back()->with('success', "Successfully imported {$importedCount} bidders.");
    }
}
