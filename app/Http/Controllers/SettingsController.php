<?php

namespace App\Http\Controllers;

use App\Models\Signatory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $signatories = Signatory::orderBy('order')->get();

        return Inertia::render('Settings', [
            'signatories' => $signatories,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'default_view' => 'required|string|in:dashboard,catalog',
            'items_per_page' => 'required|integer|in:10,25,50,100',
            'compact_mode' => 'boolean',
            'dark_mode' => 'boolean',
        ]);

        return back()->with('success', 'System settings updated successfully.');
    }
}
