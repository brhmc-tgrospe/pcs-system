<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->isDeveloper();
    }

    public function create(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->isDeveloper();
    }

    public function update(User $authUser, User $targetUser): bool
    {
        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isAdmin()) {
            // Admins can only manage Staff accounts, cannot edit other Admins or Developers
            return $targetUser->isStaff();
        }

        return false;
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) {
            return false; // Prevent self-deletion
        }

        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isAdmin()) {
            return $targetUser->isStaff();
        }

        return false;
    }

    public function impersonate(User $authUser): bool
    {
        return $authUser->isDeveloper();
    }
}
