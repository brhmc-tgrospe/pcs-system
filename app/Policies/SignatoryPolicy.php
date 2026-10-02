<?php

namespace App\Policies;

use App\Models\User;

class SignatoryPolicy
{
    public function manage(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }
}
