<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('viewAny', User::class);

        $query = User::orderBy('role')->orderBy('first_name');

        if (auth()->user()->role === 'administrator') {
            $query->where('role', '!=', 'developer');
        }

        $users = $query->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'full_name' => $u->full_name,
                'email' => $u->email,
                'role' => $u->role,
                'created_at' => $u->created_at->toISOString(),
            ]);

        return Inertia::render('ManageUsers', ['users' => $users]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:user,administrator,developer'],
        ]);

        if (auth()->user()->role === 'administrator' && $validated['role'] !== 'user') {
            return back()->with('error', 'Administrators can only create users with the User role.');
        }

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        ActivityLog::log('user_created', "User '{$user->username}' was created with role '{$user->role}'.", 'User', $user->id);

        return back()->with('success', "User '{$user->username}' created successfully.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:users,username,'.$user->id],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email,'.$user->id],
            'role' => ['required', 'in:user,administrator,developer'],
        ]);

        if (auth()->user()->role === 'administrator') {
            if (in_array($user->role, ['administrator', 'developer'])) {
                return back()->with('error', 'Administrators cannot edit other administrators or developers.');
            }
            if ($validated['role'] !== 'user') {
                return back()->with('error', 'Administrators can only assign the User role.');
            }
        }

        $this->authorize('update', $user);

        if ($request->filled('password')) {
            $request->validate(['password' => ['string', 'min:6']]);
            $validated['password'] = Hash::make($request->string('password')->toString());
        }

        $user->update($validated);

        $message = "User '{$user->username}' updated successfully.";
        if ($request->filled('password')) {
            $message = "User '{$user->username}' updated successfully, including a new password.";
        }

        ActivityLog::log('user_updated', $message, 'User', $user->id);

        return back()->with('success', $message);
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if (auth()->user()->role === 'administrator' && in_array($user->role, ['administrator', 'developer'])) {
            return back()->with('error', 'Administrators cannot delete other administrators or developers.');
        }

        $this->authorize('delete', $user);

        ActivityLog::log('user_deleted', "User '{$user->username}' was deleted.", 'User', $user->id);
        $user->delete();

        return back()->with('success', "User '{$user->username}' deleted successfully.");
    }
}
