<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= bcrypt('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::ContentManager,
            'is_active' => true,
        ];
    }

    public function role(UserRole $role): static
    {
        return $this->state(fn () => ['role' => $role]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn () => [
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
