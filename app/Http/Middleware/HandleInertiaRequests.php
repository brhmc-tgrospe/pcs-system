<?php
namespace App\Http\Middleware;

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
                    'id'               => $user->id,
                    'username'         => $user->username,
                    'first_name'       => $user->first_name,
                    'last_name'        => $user->last_name,
                    'full_name'        => $user->full_name,
                    'email'            => $user->email,
                    'role'             => $user->role,
                    'is_impersonating' => session()->has('impersonator_id'),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ];
    }
}
