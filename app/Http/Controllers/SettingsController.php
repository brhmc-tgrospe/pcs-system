<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings');
    }

    public function update(Request $request): RedirectResponse
    {
        // For demonstration purposes, we are just validating and flashing a success message.
        // In a full implementation, you would save these to a settings table or env file.
        $request->validate([
            'default_view' => 'required|string|in:dashboard,catalog',
            'items_per_page' => 'required|integer|in:10,25,50,100',
            'compact_mode' => 'boolean',
            'dark_mode' => 'boolean',
        ]);

        return back()->with('success', 'System settings updated successfully.');
    }
}
