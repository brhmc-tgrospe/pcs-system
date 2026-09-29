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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'unit_type' => ['required', 'string', 'max:100'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'numeric', 'min:1'],
            'category_id' => ['required', 'exists:categories,id'],
            'status' => ['nullable', 'string', \Illuminate\Validation\Rule::in(Item::STATUSES)],
            'awarded_bidder_id' => ['nullable', 'exists:bidders,id'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'bidders' => ['nullable', 'array'],
            'bidders.*.id' => ['required', 'exists:bidders,id'],
            'bidders.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        do {
            $code = strtoupper(\Illuminate\Support\Str::random(3)) . '-' . mt_rand(100, 999);
        } while (Item::where('item_code', $code)->exists());
        
        $validated['item_code'] = $code;
        $status = $validated['status'] ?? Item::STATUS_ACTIVE;
        $validated['status'] = $status;
        $validated['abc'] = $validated['unit_cost'] * $validated['quantity'];

        if ($status === Item::STATUS_AWARDED) {
            $bidderIds = collect($validated['bidders'] ?? [])->pluck('id')->map(fn($id) => (int)$id)->all();
            if (empty($validated['awarded_bidder_id'])) {
                return back()->withErrors(['awarded_bidder_id' => 'Please select the awarded bidder from vendor bidder quotations.']);
            }
            if (!in_array((int)$validated['awarded_bidder_id'], $bidderIds, true)) {
                return back()->withErrors(['awarded_bidder_id' => 'The awarded bidder must be one of the vendor bidder quotations for this item.']);
            }
        } else {
            $validated['awarded_bidder_id'] = null;
        }

        $item = Item::create($validated);

        if (!empty($validated['bidders'])) {
            $syncData = [];
            foreach ($validated['bidders'] as $bidder) {
                $syncData[$bidder['id']] = ['unit_cost' => $bidder['unit_cost']];
            }
            $item->bidders()->sync($syncData);
        }

        return back()->with('success', "Item '{$item->name}' created successfully.");
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'unit_type' => ['required', 'string', 'max:100'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'numeric', 'min:1'],
            'category_id' => ['required', 'exists:categories,id'],
            'status' => ['nullable', 'string', \Illuminate\Validation\Rule::in(Item::STATUSES)],
            'awarded_bidder_id' => ['nullable', 'exists:bidders,id'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'bidders' => ['nullable', 'array'],
            'bidders.*.id' => ['required', 'exists:bidders,id'],
            'bidders.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $status = $validated['status'] ?? $item->status ?? Item::STATUS_ACTIVE;
        $validated['status'] = $status;
        $validated['abc'] = $validated['unit_cost'] * $validated['quantity'];

        if ($status === Item::STATUS_AWARDED) {
            $bidderIds = isset($validated['bidders'])
                ? collect($validated['bidders'])->pluck('id')->map(fn($id) => (int)$id)->all()
                : $item->bidders()->pluck('bidders.id')->all();

            if (empty($validated['awarded_bidder_id'])) {
                return back()->withErrors(['awarded_bidder_id' => 'Please select the awarded bidder from vendor bidder quotations.']);
            }
            if (!in_array((int)$validated['awarded_bidder_id'], $bidderIds, true)) {
                return back()->withErrors(['awarded_bidder_id' => 'The awarded bidder must be one of the vendor bidder quotations for this item.']);
            }
        } else {
            $validated['awarded_bidder_id'] = null;
        }

        $item->update($validated);

        if (isset($validated['bidders'])) {
            $syncData = [];
            foreach ($validated['bidders'] as $bidder) {
                $syncData[$bidder['id']] = ['unit_cost' => $bidder['unit_cost']];
            }
            $item->bidders()->sync($syncData);
        } else {
            $item->bidders()->detach();
        }

        return back()->with('success', "Item '{$item->name}' updated successfully.");
    }

    public function destroy(Item $item): RedirectResponse
    {
        $name = $item->name;

        $item->deleteOrFail();

        return back()->with('success', "Item '{$name}' deleted successfully.");
    }


    public function restore(int $id): RedirectResponse
    {
        $item = Item::withTrashed()->findOrFail($id);
        $item->restore();
        return back()->with('success', "Item '{$item->name}' restored successfully.");
    }


    public function forceDelete(int $id): RedirectResponse
    {
        $user = auth()->guard()->user();

        if (!$user || $user->role !== 'developer') {
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
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:items,id'],
        ]);

        $count = Item::destroy($validated['ids']);

        return back()->with('success', "{$count} item(s) deleted successfully.");
    }


    public function bulkRestore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = Item::withTrashed()->whereIn('id', $validated['ids'])->restore();

        return back()->with('success', "{$count} item(s) restored successfully.");
    }



    public function bulkForceDelete(Request $request): RedirectResponse
    {
        $user = auth()->guard()->user();
        if (!$user || $user->role !== 'developer') {
            return back()->with('error', 'Only developers can permanently delete data. Please contact the developer team to have these items permanently removed.');
        }


        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = Item::withTrashed()->whereIn('id', $validated['ids'])->forceDelete();
        return back()->with('success', "{$count} item(s) permanently deleted.");
    }
}

