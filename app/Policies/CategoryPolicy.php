<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function update(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function restore(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $user->isDeveloper();
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->isDeveloper();
    }
}
