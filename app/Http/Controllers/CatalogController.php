<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $items = Item::withTrashed()->with(['category', 'bidders' => function($q) { $q->withTrashed(); }])->orderBy('item_code')->get();
        $categories = Category::withTrashed()->withCount('items')->orderBy('name')->get();
        $bidders = \App\Models\Bidder::orderBy('name')->get();
        $recentLogsQuery = ActivityLog::with('user');

        if ($user->role === 'administrator') {
            $recentLogsQuery->where(function($q) {
                $q->whereNull('user_id')
                  ->orWhereHas('user', function($uq) {
                      $uq->whereIn('role', ['administrator', 'user']);
                  });
            });
        } elseif ($user->role === 'user') {
            $recentLogsQuery->where(function($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereIn('action', ['category_created', 'item_created']);
            });
        }

        $recentLogs = $recentLogsQuery
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) use ($user) {
                $logUser = null;
                if ($log->user) {
                    if ($user->role === 'user' && $log->user_id !== $user->id) {
                        $logUser = [
                            'username'  => 'System',
                            'full_name' => 'System',
                        ];
                    } else {
                        $logUser = [
                            'username'  => $log->user->username,
                            'full_name' => $log->user->full_name,
                        ];
                    }
                }
                
                return [
                    'id'          => $log->id,
                    'action'      => $log->action,
                    'description' => $log->description,
                    'ip_address'  => $log->ip_address,
                    'created_at'  => $log->created_at->toISOString(),
                    'user'        => $logUser,
                ];
            });

        $props = compact('items', 'categories', 'recentLogs', 'bidders');

        // Only expose full user list to developers
        if ($user->role === 'developer') {
            $props['users'] = User::select('id', 'username', 'first_name', 'last_name', 'email', 'role')
                ->where('id', '!=', $user->id)
                ->orderBy('role')
                ->orderBy('first_name')
                ->get()
                ->map(fn ($u) => [
                    'id'        => $u->id,
                    'username'  => $u->username,
                    'full_name' => $u->full_name,
                    'email'     => $u->email,
                    'role'      => $u->role,
                ]);
        }

        return Inertia::render('CatalogApp', $props);
    }
}
