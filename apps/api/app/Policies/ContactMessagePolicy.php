<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/**
 * Enquiries carry personal data, so the default is no access at all —
 * a content manager who edits product copy has no business reading them.
 */
class ContactMessagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Editor);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Admin);
    }
}
