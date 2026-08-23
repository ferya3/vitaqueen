<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }

    public function view(User $user, User $target): bool
    {
        return $user->is($target) || $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }

    /** Nobody may raise an account above their own role. */
    public function update(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return true;
        }

        return $user->is_active
            && $user->atLeast(UserRole::Admin)
            && $user->role->atLeast($target->role);
    }

    public function delete(User $user, User $target): bool
    {
        // Deleting your own account through the admin API is always a mistake.
        return ! $user->is($target)
            && $user->is_active
            && $user->hasRole(UserRole::SuperAdmin);
    }

    public function viewAuditLog(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }
}
