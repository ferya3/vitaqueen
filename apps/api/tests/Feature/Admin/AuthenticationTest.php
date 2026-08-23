<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\AuditAction;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_content_manager_can_log_in_without_a_second_factor(): void
    {
        User::factory()->create([
            'email' => 'editor@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
            'role' => UserRole::ContentManager,
        ]);

        $this->postJson('/api/v1/admin/login', [
            'email' => 'editor@vitaqueen.test',
            'password' => 'a-long-enough-password',
        ])->assertOk()->assertJsonStructure(['token', 'expiresAt', 'user' => ['id', 'role']]);
    }

    public function test_wrong_credentials_and_unknown_accounts_are_indistinguishable(): void
    {
        User::factory()->create([
            'email' => 'known@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
        ]);

        $wrongPassword = $this->postJson('/api/v1/admin/login', [
            'email' => 'known@vitaqueen.test',
            'password' => 'not-the-password',
        ]);

        $unknownUser = $this->postJson('/api/v1/admin/login', [
            'email' => 'nobody@vitaqueen.test',
            'password' => 'not-the-password',
        ]);

        $wrongPassword->assertStatus(422);
        $unknownUser->assertStatus(422);
        $this->assertSame(
            $wrongPassword->json('errors.email'),
            $unknownUser->json('errors.email'),
        );
    }

    public function test_a_deactivated_account_cannot_log_in(): void
    {
        User::factory()->create([
            'email' => 'gone@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/admin/login', [
            'email' => 'gone@vitaqueen.test',
            'password' => 'a-long-enough-password',
        ])->assertStatus(422);
    }

    public function test_failed_attempts_are_written_to_the_audit_log(): void
    {
        $this->postJson('/api/v1/admin/login', [
            'email' => 'nobody@vitaqueen.test',
            'password' => 'whatever',
        ])->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', [
            'action' => AuditAction::LoginFailed->value,
            'user_email' => 'nobody@vitaqueen.test',
        ]);
    }

    public function test_repeated_failures_are_locked_out(): void
    {
        User::factory()->create([
            'email' => 'target@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/login', [
                'email' => 'target@vitaqueen.test',
                'password' => 'wrong',
            ]);
        }

        // Even the correct password is refused once the limiter has tripped.
        $this->postJson('/api/v1/admin/login', [
            'email' => 'target@vitaqueen.test',
            'password' => 'a-long-enough-password',
        ])->assertStatus(429);
    }

    public function test_an_account_that_requires_two_factor_must_provide_a_code(): void
    {
        User::factory()->withTwoFactor()->create([
            'email' => 'admin@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
            'role' => UserRole::Admin,
        ]);

        $this->postJson('/api/v1/admin/login', [
            'email' => 'admin@vitaqueen.test',
            'password' => 'a-long-enough-password',
        ])->assertStatus(409)->assertJson(['status' => 'two_factor_required']);
    }

    public function test_a_privileged_account_without_two_factor_cannot_reach_the_admin_api(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403)
            ->assertJson(['code' => 'two_factor_required']);
    }

    public function test_the_admin_api_is_closed_to_anonymous_requests(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertStatus(401);
        $this->getJson('/api/v1/admin/audit-logs')->assertStatus(401);
        $this->postJson('/api/v1/admin/products', [])->assertStatus(401);
    }

    public function test_a_successful_login_is_audited(): void
    {
        User::factory()->create([
            'email' => 'editor@vitaqueen.test',
            'password' => Hash::make('a-long-enough-password'),
            'role' => UserRole::ContentManager,
        ]);

        $this->postJson('/api/v1/admin/login', [
            'email' => 'editor@vitaqueen.test',
            'password' => 'a-long-enough-password',
        ])->assertOk();

        $this->assertTrue(
            AuditLog::where('action', AuditAction::LoginSucceeded)->exists(),
        );
    }
}
