<?php

namespace App\Http\Controllers;

use App\Services\ItemImportService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ItemImportController extends Controller
{
    public function import(Request $request, ItemImportService $importService): RedirectResponse
    {
        $request->validate([
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'], // 5MB max
        ]);

        try {
            $result = $importService->import($request->file('csv_file'));
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        $added = $result['added'];
        $updated = $result['updated'];
        $errors = $result['errors'];

        if (count($errors) > 0) {
            $msg = "Processed items: {$added} added, {$updated} updated, with ".count($errors).' error(s).';

            return back()->with('success', $msg)->with('import_errors', $errors);
        }

        return back()->with('success', "Successfully processed items: {$added} added, {$updated} updated.");
    }
}
