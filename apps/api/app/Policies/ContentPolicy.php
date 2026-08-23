<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/**
 * Shared authorisation for every content resource.
 *
 * One policy rather than eight near-identical ones: products, certificates,
 * news, pages, stages and distributors all follow the same rule, and eight
 * copies of that rule is eight places for it to drift.
 *
 *   content manager  → read and write drafts
 *   editor           → the above, plus publish and delete
 *   admin            → the above, plus destructive operations
 */
abstract class ContentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::ContentManager);
    }

    public function update(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::ContentManager);
    }

    /** Making something visible to the public is an editor's decision. */
    public function publish(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Editor);
    }

    public function delete(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Editor);
    }

    public function forceDelete(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }
}
