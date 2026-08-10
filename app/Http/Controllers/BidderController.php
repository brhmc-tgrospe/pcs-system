<?php

namespace App\Http\Controllers;

use App\Models\Bidder;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bidder_code' => ['required', 'string', 'max:255', 'unique:bidders,bidder_code'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
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
