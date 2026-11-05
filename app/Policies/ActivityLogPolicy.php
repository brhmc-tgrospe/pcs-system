<?php

namespace App\Policies;

use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    public function prune(User $user): bool
    {
        return $user->isDeveloper();
    }
}
