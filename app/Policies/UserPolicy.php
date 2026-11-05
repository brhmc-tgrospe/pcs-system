<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->isAdministrative() || $authUser->isDeveloper();
    }

    public function create(User $authUser): bool
    {
        return $authUser->isAdministrative() || $authUser->isDeveloper();
    }

    public function update(User $authUser, User $targetUser): bool
    {
        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isSuperAdmin()) {
            return $targetUser->isAdmin() || $targetUser->isStaff();
        }

        if ($authUser->isAdmin()) {
            return $targetUser->isStaff();
        }

        return false;
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) {
            return false;
        }

        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isSuperAdmin()) {
            return $targetUser->isAdmin() || $targetUser->isStaff();
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
