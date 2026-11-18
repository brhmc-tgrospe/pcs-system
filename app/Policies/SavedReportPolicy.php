<?php

namespace App\Policies;

use App\Models\SavedReport;
use App\Models\User;

class SavedReportPolicy
{
    /**
     * Determine whether the user can view any saved reports.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the saved report.
     */
    public function view(User $user, SavedReport $savedReport): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create/save a report.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can soft delete the saved report.
     * Allowed: administrator, superadmin, developer.
     */
    public function delete(User $user, SavedReport $savedReport): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    /**
     * Determine whether the user can bulk soft delete saved reports.
     */
    public function deleteAny(User $user): bool
    {
        return $user->isAdministrative() || $user->isDeveloper();
    }

    /**
     * Determine whether the user can restore a soft-deleted report.
     * Allowed: Developer ONLY.
     */
    public function restore(User $user, SavedReport $savedReport): bool
    {
        return $user->isDeveloper();
    }

    /**
     * Determine whether the user can bulk restore soft-deleted reports.
     * Allowed: Developer ONLY.
     */
    public function restoreAny(User $user): bool
    {
        return $user->isDeveloper();
    }

    /**
     * Determine whether the user can permanently delete the saved report.
     * Allowed: Developer ONLY.
     */
    public function forceDelete(User $user, SavedReport $savedReport): bool
    {
        return $user->isDeveloper();
    }

    /**
     * Determine whether the user can bulk permanently delete saved reports.
     * Allowed: Developer ONLY.
     */
    public function forceDeleteAny(User $user): bool
    {
        return $user->isDeveloper();
    }
}
