<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_record_is_logged_against_the_acting_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $product = Product::create([
            'slug' => '500ml', 'sku' => 'VQ-500', 'volume_ml' => 500,
            'name' => ['en' => 'VitaQueen 500'],
        ]);

        // Scoped to the product: creating the acting user was audited too.
        $log = AuditLog::where('action', AuditAction::Created)
            ->where('resource_type', Product::class)
            ->first();

        $this->assertNotNull($log);
        $this->assertSame(Product::class, $log->resource_type);
        $this->assertSame((string) $product->id, $log->resource_id);
        $this->assertSame($user->id, $log->user_id);
    }

    public function test_an_update_records_only_what_changed(): void
    {
        $product = Product::create([
            'slug' => '500ml', 'sku' => 'VQ-500', 'volume_ml' => 500,
            'name' => ['en' => 'VitaQueen 500'], 'is_published' => false,
        ]);

        $product->update(['is_published' => true]);

        $log = AuditLog::where('action', AuditAction::Updated)->latest('id')->first();

        $this->assertSame(['is_published' => true], $log->after);
        $this->assertSame(['is_published' => false], $log->before);
        // The untouched columns are absent, which is what makes the log readable.
        $this->assertArrayNotHasKey('sku', $log->after);
    }

    public function test_secrets_never_reach_the_audit_log(): void
    {
        $user = User::factory()->create();

        $user->update(['password' => 'a-brand-new-password']);

        $log = AuditLog::where('resource_type', User::class)
            ->where('action', AuditAction::Updated)
            ->latest('id')
            ->first();

        if ($log !== null) {
            $this->assertArrayNotHasKey('password', $log->after ?? []);
            $this->assertArrayNotHasKey('two_factor_secret', $log->after ?? []);
        }

        $this->assertDatabaseMissing('audit_logs', ['after' => json_encode(['password' => 'a-brand-new-password'])]);
    }
}
