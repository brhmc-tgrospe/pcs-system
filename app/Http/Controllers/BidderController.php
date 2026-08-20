<?php

namespace App\Http\Controllers;

use App\Models\Bidder;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BidderController extends Controller
{
    public function index(): Response
    {
        $bidders = Bidder::withTrashed()->get();
        return Inertia::render('Bidders', [
            'bidders' => $bidders
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->has('bidders') && is_array($request->input('bidders'))) {
            $validated = $request->validate([
                'bidders' => ['required', 'array', 'min:1'],
                'bidders.*.name' => ['required', 'string', 'max:255'],
                'bidders.*.bidder_code' => ['required', 'string', 'max:255', 'distinct', 'unique:bidders,bidder_code'],
                'bidders.*.contact_person' => ['nullable', 'string', 'max:255'],
                'bidders.*.contact_number' => ['nullable', 'string', 'max:255'],
                'bidders.*.email' => ['nullable', 'email', 'max:255'],
                'bidders.*.address' => ['nullable', 'string'],
                'bidders.*.location' => ['nullable', 'string', 'max:255'],
            ], [
                'bidders.*.name.required' => 'Bidder name is required.',
                'bidders.*.bidder_code.required' => 'Bidder code is required.',
                'bidders.*.bidder_code.distinct' => 'Each bidder code must be unique.',
                'bidders.*.bidder_code.unique' => 'The bidder code :input has already been taken.',
            ]);

            DB::transaction(function () use ($validated) {
                foreach ($validated['bidders'] as $bidderData) {
                    Bidder::create($bidderData);
                }
            });

            $count = count($validated['bidders']);
            return back()->with('success', $count > 1 ? "{$count} bidders added successfully." : 'Bidder added successfully.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bidder_code' => ['required', 'string', 'max:255', 'unique:bidders,bidder_code'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        Bidder::create($validated);

        return back()->with('success', 'Bidder added successfully.');
    }

    public function update(Request $request, Bidder $bidder): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bidder_code' => ['required', 'string', 'max:255', 'unique:bidders,bidder_code,' . $bidder->id],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $bidder->update($validated);

        return back()->with('success', 'Bidder updated successfully.');
    }

    public function destroy(Bidder $bidder): RedirectResponse
    {
        if ($bidder->items()->exists()) {
            return back()->with('error', "Cannot delete Bidder '{$bidder->name}' because it has bids associated with it.");
        }

        $bidder->delete();
        return back()->with('success', "Bidder '{$bidder->name}' deleted successfully.");
    }

    public function restore(int $id): RedirectResponse
    {
        $bidder = Bidder::withTrashed()->findOrFail($id);
        $bidder->restore();
        return back()->with('success', "Bidder '{$bidder->name}' restored successfully.");
    }
}
