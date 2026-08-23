<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranslationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_resolves_the_current_locale(): void
    {
        $product = Product::create([
            'slug' => '500ml', 'sku' => 'VQ-500', 'volume_ml' => 500,
            'name' => ['fa' => 'ویتاکوئین', 'en' => 'VitaQueen'],
        ]);

        app()->setLocale('fa');
        $this->assertSame('ویتاکوئین', $product->name);

        app()->setLocale('en');
        $this->assertSame('VitaQueen', $product->name);
    }

    public function test_a_missing_translation_falls_back_rather_than_rendering_blank(): void
    {
        $product = Product::create([
            'slug' => '1l', 'sku' => 'VQ-1000', 'volume_ml' => 1000,
            'name' => ['en' => 'VitaQueen 1 L'],
        ]);

        app()->setLocale('ru');
        $this->assertSame('VitaQueen 1 L', $product->name);
    }

    public function test_it_falls_back_to_any_populated_locale_as_a_last_resort(): void
    {
        $product = Product::create([
            'slug' => '5l', 'sku' => 'VQ-5000', 'volume_ml' => 5000,
            'name' => ['ar' => 'فيتاكوين 5 لتر'],
        ]);

        app()->setLocale('ru');
        // Neither Russian nor the fallback locale is present, but the record
        // still has a readable name and that is what should be shown.
        $this->assertSame('فيتاكوين 5 لتر', $product->name);
    }

    public function test_a_single_locale_can_be_updated_without_losing_the_others(): void
    {
        $product = Product::create([
            'slug' => '330ml', 'sku' => 'VQ-330', 'volume_ml' => 330,
            'name' => ['fa' => 'الف', 'en' => 'A'],
        ]);

        $product->setTranslation('name', 'ru', 'А')->save();

        $this->assertSame('الف', $product->fresh()->getTranslation('name', 'fa'));
        $this->assertSame('А', $product->fresh()->getTranslation('name', 'ru'));
    }
}
