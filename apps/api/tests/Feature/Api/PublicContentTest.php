<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Certificate;
use App\Models\Product;
use App\Models\WaterAnalysis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_only_published_products(): void
    {
        Product::create(['slug' => 'published', 'sku' => 'A', 'name' => ['en' => 'Published'], 'volume_ml' => 500, 'is_published' => true]);
        Product::create(['slug' => 'draft', 'sku' => 'B', 'name' => ['en' => 'Draft'], 'volume_ml' => 500, 'is_published' => false]);

        $response = $this->getJson('/api/v1/products');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('published', $response->json('data.0.slug'));
    }

    public function test_a_draft_product_is_not_reachable_by_slug(): void
    {
        Product::create(['slug' => 'draft', 'sku' => 'B', 'name' => ['en' => 'Draft'], 'volume_ml' => 500, 'is_published' => false]);

        $this->getJson('/api/v1/products/draft')->assertNotFound();
    }

    public function test_it_returns_content_in_the_requested_language(): void
    {
        Product::create([
            'slug' => '500ml',
            'sku' => 'VQ-500',
            'name' => ['fa' => 'ویتاکوئین ۵۰۰', 'en' => 'VitaQueen 500'],
            'volume_ml' => 500,
            'is_published' => true,
        ]);

        $this->getJson('/api/v1/products', ['Accept-Language' => 'fa'])
            ->assertOk()
            ->assertJsonPath('data.0.name', 'ویتاکوئین ۵۰۰');

        $this->getJson('/api/v1/products', ['Accept-Language' => 'ru-RU,ru;q=0.9,en;q=0.8'])
            // Russian is missing, so it falls back rather than rendering blank.
            ->assertOk()
            ->assertJsonPath('data.0.name', 'VitaQueen 500');
    }

    public function test_expired_certificates_are_never_published(): void
    {
        Certificate::create([
            'slug' => 'current', 'title' => ['en' => 'Current'], 'issuer' => ['en' => 'Body'],
            'valid_until' => now()->addYear(), 'is_published' => true,
        ]);
        Certificate::create([
            'slug' => 'lapsed', 'title' => ['en' => 'Lapsed'], 'issuer' => ['en' => 'Body'],
            'valid_until' => now()->subDay(), 'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/certificates');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('current', $response->json('data.0.slug'));
    }

    public function test_an_unpublished_analysis_is_not_served(): void
    {
        WaterAnalysis::create([
            'sampling_point' => 'Wellhead', 'sampled_at' => now()->subMonth(),
            'ph' => 7.4, 'tds' => 342, 'is_published' => false,
        ]);

        $this->getJson('/api/v1/water-analysis')->assertNotFound();
    }

    public function test_responses_carry_security_headers(): void
    {
        $this->getJson('/api/v1/products')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Content-Language', 'en');
    }
}
