<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use Auditable, HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'is_active'];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'role' => UserRole::class,
            // Argon2id via config/hashing.php.
            'password' => 'hashed',
            // Encrypted at rest: an audit-table or backup leak must not hand
            // over working second factors.
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
        ];
    }

    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    public function atLeast(UserRole $role): bool
    {
        return $this->role->atLeast($role);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_secret !== null && $this->two_factor_confirmed_at !== null;
    }

    /** Ability list stamped onto the Sanctum token at login. */
    public function tokenAbilities(): array
    {
        return match ($this->role) {
            UserRole::SuperAdmin => ['*'],
            UserRole::Admin => ['content:*', 'media:*', 'contact:*', 'users:read'],
            UserRole::Editor => ['content:*', 'media:*', 'contact:read'],
            UserRole::ContentManager => ['content:read', 'content:write', 'media:read', 'media:write'],
        };
    }
}
