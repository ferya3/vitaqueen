<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Role-based access control.
 *
 * Roles are ordered by power. Everything in the admin API is authorised through
 * policies that ask `atLeast()` rather than comparing role strings, so adding a
 * role later means touching this file and nothing else.
 */
enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Editor = 'editor';
    case ContentManager = 'content_manager';

    public function level(): int
    {
        return match ($this) {
            self::SuperAdmin => 40,
            self::Admin => 30,
            self::Editor => 20,
            self::ContentManager => 10,
        };
    }

    public function atLeast(self $role): bool
    {
        return $this->level() >= $role->level();
    }

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super admin',
            self::Admin => 'Admin',
            self::Editor => 'Editor',
            self::ContentManager => 'Content manager',
        };
    }
}
