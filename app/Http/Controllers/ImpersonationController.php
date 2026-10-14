<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public function impersonate(User $user): RedirectResponse
    {
        // Role check is now done at route middleware level (role:developer)
        // Extra safety check
        if (Auth::user()->role !== 'developer') {
            abort(403, 'Only developers can impersonate users.');
        }

        $developer = Auth::user();

        session()->put('impersonator_id', Auth::id());

        ActivityLog::log(
            'impersonation_started',
            "Developer '{$developer->username}' started impersonating user '{$user->username}'.",
            'User',
            $user->id
        );

        Auth::login($user);

        return redirect()->route('catalog');
    }

    public function leave(): RedirectResponse
    {
        if (! session()->has('impersonator_id')) {
            abort(403, 'You are not impersonating anyone.');
        }

        $impersonatedUser = Auth::user();
        $impersonatorId = session()->pull('impersonator_id');
        $originalUser = User::findOrFail($impersonatorId);

        Auth::login($originalUser);

        ActivityLog::log(
            'impersonation_ended',
            "Developer '{$originalUser->username}' stopped impersonating '{$impersonatedUser->username}'.",
            'User',
            $impersonatedUser->id
        );

        return redirect()->route('catalog');
    }
}
