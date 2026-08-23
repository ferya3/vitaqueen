<?php

declare(strict_types=1);

namespace Tests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /**
     * Authenticates as a user of the given role, with a confirmed second
     * factor so that `EnsureTwoFactorIsEnabled` is satisfied. Tests that care
     * about the 2FA gate build their own user instead.
     */
    protected function actingAsRole(UserRole $role): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'is_active' => true,
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);

        Sanctum::actingAs($user, ['*']);

        return $user;
    }
}
