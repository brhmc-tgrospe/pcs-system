<?php

namespace App\Http\Controllers;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                'bidders' => [],
                'users' => [],
            ]);
        }

        // 1. Items (Active items matching name, item_code, or description)
        $items = Item::with('category')
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('item_code', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->limit(6)
            ->get();

        // 2. Categories (Matching name or cat_code)
        $categories = Category::where('name', 'like', "%{$query}%")
            ->orWhere('cat_code', 'like', "%{$query}%")
            ->limit(6)
            ->get();

        // 3. Bidders & Users (Restricted to Administrator & Developer roles)
        $bidders = [];
        $users = [];

        if (in_array($user->role, ['administrator', 'developer'])) {
            $bidders = Bidder::where('name', 'like', "%{$query}%")
                ->orWhere('contact_person', 'like', "%{$query}%")
                ->orWhere('contact_number', 'like', "%{$query}%")
                ->orWhere('bidder_code', 'like', "%{$query}%")
                ->limit(6)
                ->get();

            $userQuery = User::where(function ($q) use ($query) {
                $q->where('username', 'like', "%{$query}%")
                    ->orWhere('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            });

            if ($user->role === 'administrator') {
                $userQuery->whereIn('role', ['administrator', 'user']);
            }

            $users = $userQuery->limit(6)->get();
        }

        return response()->json([
            'items' => $items,
            'categories' => $categories,
            'bidders' => $bidders,
            'users' => $users,
        ]);
    }
}
