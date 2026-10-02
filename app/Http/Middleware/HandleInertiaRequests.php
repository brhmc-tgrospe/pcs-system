<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use App\Models\Signatory;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'username' => $user->username,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_impersonating' => session()->has('impersonator_id'),
                    'can' => [
                        'manage_items' => $user->can('create', Item::class),
                        'force_delete' => $user->can('forceDeleteAny', Item::class),
                        'manage_categories' => $user->can('create', Category::class),
                        'manage_bidders' => $user->can('create', Bidder::class),
                        'manage_users' => $user->can('viewAny', User::class),
                        'view_logs' => $user->can('viewAny', ActivityLog::class),
                        'manage_settings' => $user->can('manage', Signatory::class),
                        'impersonate' => $user->can('impersonate', User::class),
                    ],
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'import_errors' => $request->session()->get('import_errors'),
            ],
        ];
    }
}
