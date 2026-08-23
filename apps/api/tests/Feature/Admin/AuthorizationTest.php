<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        return Product::create([
            'slug' => '500ml', 'sku' => 'VQ-500',
            'name' => ['en' => 'VitaQueen 500'], 'volume_ml' => 500, 'is_published' => true,
        ]);
    }

    public function test_a_content_manager_can_edit_but_not_delete(): void
    {
        $product = $this->product();
        $this->actingAsRole(UserRole::ContentManager);

        $this->patchJson("/api/v1/admin/products/{$product->slug}", ['position' => 3])->assertOk();
        $this->deleteJson("/api/v1/admin/products/{$product->slug}")->assertStatus(403);
    }

    public function test_an_editor_can_delete(): void
    {
        $product = $this->product();
        $this->actingAsRole(UserRole::Editor);

        $this->deleteJson("/api/v1/admin/products/{$product->slug}")->assertStatus(204);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_a_content_manager_cannot_read_the_enquiry_inbox(): void
    {
        $this->actingAsRole(UserRole::ContentManager);

        $this->getJson('/api/v1/admin/contact-messages')->assertStatus(403);
    }

    public function test_an_editor_can_read_the_enquiry_inbox(): void
    {
        $this->actingAsRole(UserRole::Editor);

        $this->getJson('/api/v1/admin/contact-messages')->assertOk();
    }

    public function test_only_admins_can_read_the_audit_log(): void
    {
        $this->actingAsRole(UserRole::Editor);
        $this->getJson('/api/v1/admin/audit-logs')->assertStatus(403);

        $this->actingAsRole(UserRole::Admin);
        $this->getJson('/api/v1/admin/audit-logs')->assertOk();
    }

    public function test_nobody_can_promote_an_account_above_their_own_role(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $this->postJson('/api/v1/admin/users', [
            'name' => 'New Super',
            'email' => 'super@vitaqueen.test',
            'password' => 'Str0ng!Passw0rd#2026x',
            'password_confirmation' => 'Str0ng!Passw0rd#2026x',
            'role' => UserRole::SuperAdmin->value,
        ])->assertStatus(403);
    }

    public function test_changing_a_role_revokes_that_account_tokens(): void
    {
        $this->actingAsRole(UserRole::SuperAdmin);
        $target = User::factory()->create(['role' => UserRole::ContentManager]);
        $target->createToken('laptop');

        $this->assertSame(1, $target->tokens()->count());

        $this->patchJson("/api/v1/admin/users/{$target->id}", [
            'role' => UserRole::Editor->value,
        ])->assertOk();

        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_only_an_editor_may_publish_an_analysis(): void
    {
        $this->actingAsRole(UserRole::ContentManager);

        $this->postJson('/api/v1/admin/water-analyses', [
            'sampling_point' => 'Wellhead',
            'sampled_at' => now()->subDay()->toDateString(),
            'ph' => 7.4,
            'tds' => 342,
        ])->assertStatus(403);
    }
}
