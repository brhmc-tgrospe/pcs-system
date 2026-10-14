<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Item;
use App\Models\Signatory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrintReportController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'item_count' => ['required', 'integer', 'min:1'],
            'contract_name' => ['nullable', 'string', 'max:255'],
            'project_ref_no' => ['nullable', 'string', 'max:255'],
        ]);

        $categoryNames = implode(', ', $validated['categories']);
        $contractInfo = ! empty($validated['contract_name']) ? " for '{$validated['contract_name']}'" : '';
        ActivityLog::log(
            'report_printed',
            "Report generated{$contractInfo} with {$validated['item_count']} item(s) from categories: {$categoryNames}."
        );

        return back();
    }

    public function show(Request $request): Response
    {
        $itemIds = array_filter(explode(',', $request->query('items', '')));

        $items = Item::with(['category', 'bidders' => function ($q) {
            $q->orderBy('name');
        }])
            ->whereIn('id', $itemIds)
            ->orderBy('item_code')
            ->get();

        // Group items by category for easier rendering in frontend
        $categories = Category::whereIn('id', $items->pluck('category_id')->unique())->orderBy('name')->get();
        $signatories = Signatory::where('is_active', true)->orderBy('order')->get();

        $metadata = [
            'project_ref_no' => $request->query('project_ref_no', 'PB 22-2026'),
            'contract_name' => $request->query('contract_name', 'Procurement of Medical Supplies'),
            'contract_location' => $request->query('contract_location', 'BRHMC-Daraga, Albay'),
            'implementing_office' => $request->query('implementing_office', 'Bicol Regional Hospital and Medical Center'),
            'report_date' => $request->query('report_date', now()->format('F d, Y')),
            'report_time' => $request->query('report_time', now()->format('h:iA')),
        ];

        return Inertia::render('ReportView', [
            'items' => $items,
            'categories' => $categories,
            'signatories' => $signatories,
            'metadata' => $metadata,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
