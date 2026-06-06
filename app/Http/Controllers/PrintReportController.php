<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PrintReportController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'item_count' => ['required', 'integer', 'min:1'],
        ]);

        $categoryNames = implode(', ', $validated['categories']);
        ActivityLog::log(
            'report_printed',
            "Report generated with {$validated['item_count']} item(s) from categories: {$categoryNames}."
        );

        return back();
    }

    public function show(Request $request): Response
    {
        $itemIds = array_filter(explode(',', $request->query('items', '')));
        
        $items = Item::with('category')
            ->whereIn('id', $itemIds)
            ->where('is_active', true)
            ->get();
            
        // Group items by category for easier rendering in frontend
        $categories = Category::whereIn('id', $items->pluck('category_id')->unique())->orderBy('name')->get();

        return Inertia::render('ReportView', [
            'items' => $items,
            'categories' => $categories,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
