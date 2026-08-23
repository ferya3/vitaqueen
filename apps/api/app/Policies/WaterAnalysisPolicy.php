<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/**
 * Analyses are the factory's evidence, not marketing copy.
 *
 * A content manager can read them; only an editor can enter one, and only an
 * admin can change or withdraw one that has already been published — because
 * quietly editing a published analysis is exactly the action an auditor would
 * want to be impossible without a trace.
 */
class WaterAnalysisPolicy extends ContentPolicy
{
    public function create(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Editor);
    }

    public function update(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }

    public function delete(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }
}
