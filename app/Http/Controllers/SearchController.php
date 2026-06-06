<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim();
        $user = auth()->user();

        if (strlen($query) < 2) {
            return response()->json([
                'items' => [],
                'categories' => [],
                'users' => []
            ]);
        }

        $items = Item::with('category')
            ->where('is_active', true)
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('item_code', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get();

        $categories = Category::where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get();

        $users = [];
        if (in_array($user->role, ['administrator', 'developer'])) {
            $userQuery = User::where(function($q) use ($query) {
                $q->where('username', 'like', "%{$query}%")
                  ->orWhere('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%");
            });

            if ($user->role === 'administrator') {
                $userQuery->whereIn('role', ['administrator', 'user']);
            }

            $users = $userQuery->limit(5)->get();
        }

        return response()->json([
            'items' => $items,
            'categories' => $categories,
            'users' => $users
        ]);
    }
}
