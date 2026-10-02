<?php

namespace App\Policies;

use App\Models\Bidder;
use App\Models\User;

class BidderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bidder $bidder): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function update(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function delete(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function restore(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }
}
