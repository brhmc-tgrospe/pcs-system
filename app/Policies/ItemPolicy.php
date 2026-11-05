<?php

namespace App\Policies;

use App\Models\Item;
use App\Models\User;

class ItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Item $item): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function update(User $user, Item $item): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function delete(User $user, Item $item): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function deleteAny(User $user): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function restore(User $user, Item $item): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function restoreAny(User $user): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function forceDelete(User $user, Item $item): bool
    {
        return $user->isDeveloper() || $user->isSuperAdmin();
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isSuperAdmin();
    }
}
