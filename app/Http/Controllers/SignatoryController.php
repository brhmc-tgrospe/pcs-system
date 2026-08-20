<?php

namespace App\Http\Controllers;

use App\Models\Signatory;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class SignatoryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['administrator', 'developer'])) {
            return back()->with('error', 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
        ]);

        if (!isset($validated['order'])) {
            $maxOrder = Signatory::max('order') ?? 0;
            $validated['order'] = $maxOrder + 1;
        }

        $validated['is_active'] = true;

        Signatory::create($validated);

        return back()->with('success', 'Signatory added successfully.');
    }

    public function update(Request $request, Signatory $signatory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['administrator', 'developer'])) {
            return back()->with('error', 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'order' => ['required', 'integer'],
            'is_active' => ['boolean'],
        ]);

        $signatory->update($validated);

        return back()->with('success', 'Signatory updated successfully.');
    }

    public function destroy(Signatory $signatory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['administrator', 'developer'])) {
            return back()->with('error', 'Unauthorized access.');
        }

        $signatory->delete();

        return back()->with('success', 'Signatory deleted successfully.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['administrator', 'developer'])) {
            return back()->with('error', 'Unauthorized access.');
        }

        $validated = $request->validate([
            'signatories' => ['required', 'array'],
            'signatories.*.id' => ['required', 'exists:signatories,id'],
            'signatories.*.order' => ['required', 'integer'],
        ]);

        foreach ($validated['signatories'] as $item) {
            Signatory::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return back()->with('success', 'Signatories reordered successfully.');
    }
}
