<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Media;
use App\Models\User;

class MediaPolicy extends ContentPolicy
{
    /**
     * Uploading is part of writing content, so a content manager can do it.
     * Deleting is not: an asset removed from the library breaks every page
     * that still references it, and nothing warns you which pages those are.
     */
    public function delete(User $user, ?Media $media = null): bool
    {
        return $user->is_active && $user->atLeast(UserRole::Editor);
    }
}
