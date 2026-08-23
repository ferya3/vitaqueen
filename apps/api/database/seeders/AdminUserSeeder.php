<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Creates the first administrator.
 *
 * The password is either supplied through `ADMIN_SEED_PASSWORD` or generated
 * and printed once. There is no default password in this file, because a
 * default password in a seeder is a default password in production.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_SEED_EMAIL', 'admin@vitaqueen.com');

        if (User::where('email', $email)->exists()) {
            $this->command?->info("Admin user {$email} already exists; leaving it alone.");

            return;
        }

        $password = env('ADMIN_SEED_PASSWORD') ?: Str::password(20);

        User::create([
            'name' => env('ADMIN_SEED_NAME', 'VitaQueen Admin'),
            'email' => $email,
            'password' => $password,
            'role' => UserRole::SuperAdmin->value,
            'is_active' => true,
        ]);

        $this->command?->warn("Created super admin {$email}");

        if (! env('ADMIN_SEED_PASSWORD')) {
            $this->command?->warn("Generated password: {$password}");
            $this->command?->warn('This is shown once. Store it in a password manager and enrol 2FA at first login.');
        }
    }
}
