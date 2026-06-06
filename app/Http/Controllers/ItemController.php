<?php
namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class ItemController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_code'      => ['required', 'string', 'max:50', 'unique:items,item_code'],
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string'],
            'specifications' => ['nullable', 'array'],
            'unit_type'      => ['required', 'string', 'max:100'],
            'unit_price'     => ['required', 'numeric', 'min:0'],
            'price_referral' => ['nullable', 'string', 'max:50'],
            'category_id'    => ['required', 'exists:categories,id'],
            'is_active'      => ['boolean'],
            'image_url'      => ['nullable', 'string', 'max:500'],
        ]);

        $item = Item::create($validated);

        return back()->with('success', "Item '{$item->name}' created successfully.");
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'item_code'      => ['required', 'string', 'max:50', 'unique:items,item_code,' . $item->id],
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string'],
            'specifications' => ['nullable', 'array'],
            'unit_type'      => ['required', 'string', 'max:100'],
            'unit_price'     => ['required', 'numeric', 'min:0'],
            'price_referral' => ['nullable', 'string', 'max:50'],
            'category_id'    => ['required', 'exists:categories,id'],
            'is_active'      => ['boolean'],
            'image_url'      => ['nullable', 'string', 'max:500'],
        ]);

        $item->update($validated);

        return back()->with('success', "Item '{$item->name}' updated successfully.");
    }

    public function destroy(Item $item): RedirectResponse
    {
        $name = $item->name;
        $item->delete();
        return back()->with('success', "Item '{$name}' deleted successfully.");
    }

    public function restore($id): RedirectResponse
    {
        $item = Item::withTrashed()->findOrFail($id);
        $item->restore();
        return back()->with('success', "Item '{$item->name}' restored successfully.");
    }
    public function forceDelete($id): RedirectResponse
    {
        if (auth()->user()->role !== 'developer') {
            return back()->with('error', 'Only developers can permanently delete data. Please contact the developer team to have this item permanently removed.');
        }

        $item = Item::withTrashed()->findOrFail($id);
        $name = $item->name;
        $item->forceDelete();
        return back()->with('success', "Item '{$name}' permanently deleted.");
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:items,id'],
        ]);

        $count = Item::whereIn('id', $validated['ids'])->delete();
        return back()->with('success', "{$count} item(s) deleted successfully.");
    }

    public function bulkRestore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = Item::withTrashed()->whereIn('id', $validated['ids'])->restore();
        return back()->with('success', "{$count} item(s) restored successfully.");
    }

    public function bulkForceDelete(Request $request): RedirectResponse
    {
        if (auth()->user()->role !== 'developer') {
            return back()->with('error', 'Only developers can permanently delete data. Please contact the developer team to have these items permanently removed.');
        }

        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = Item::withTrashed()->whereIn('id', $validated['ids'])->forceDelete();
        return back()->with('success', "{$count} item(s) permanently deleted.");
    }
}
