<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Business logic for products.
 *
 * Controllers stay thin: they validate input and hand it here.
 *
 * There is deliberately no application-level cache of Eloquent models. Caching
 * public reads belongs at the HTTP layer — Cloudflare and the Next.js data
 * cache, driven by the headers `PublicCacheHeaders` sets — where it is shared
 * across processes, invalidated by time rather than by hand, and immune to the
 * serialisation problems that come with storing model instances between
 * deploys. See `docs/architecture.md`.
 */
final class ProductService
{
    public function publishedList(): Collection
    {
        return Product::published()->with(['images', 'certificates', 'datasheet'])->get();
    }

    public function findPublished(string $slug): ?Product
    {
        return Product::published()
            ->with(['images', 'certificates', 'datasheet'])
            ->where('slug', $slug)
            ->first();
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data): Product {
            $product = new Product;
            $this->fill($product, $data);
            $product->slug = $data['slug'] ?? $this->uniqueSlug($data['name'][config('app.fallback_locale')] ?? $data['sku']);
            $product->save();

            $this->syncRelations($product, $data);

            return $product->fresh(['images', 'certificates']);
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data): Product {
            $this->fill($product, $data);
            if (isset($data['slug'])) {
                $product->slug = $data['slug'];
            }
            $product->save();

            $this->syncRelations($product, $data);

            return $product->fresh(['images', 'certificates']);
        });
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    /** @param array<string, mixed> $data */
    private function fill(Product $product, array $data): void
    {
        foreach (['name', 'tagline', 'description', 'packaging'] as $key) {
            if (isset($data[$key]) && is_array($data[$key])) {
                $product->setTranslations($key, $data[$key]);
            }
        }

        $product->fill(array_intersect_key($data, array_flip([
            'sku', 'volume_ml', 'bottle_type', 'cap_type', 'ph', 'tds',
            'shelf_life_months', 'units_per_case', 'cases_per_pallet', 'barcode',
            'datasheet_media_id', 'model_3d_url', 'featured', 'is_published', 'position',
        ])));
    }

    /** @param array<string, mixed> $data */
    private function syncRelations(Product $product, array $data): void
    {
        if (isset($data['media_ids']) && is_array($data['media_ids'])) {
            $product->images()->sync(
                collect($data['media_ids'])
                    ->values()
                    ->mapWithKeys(fn ($id, $index) => [$id => ['position' => $index]])
                    ->all(),
            );
        }

        if (isset($data['certificate_ids']) && is_array($data['certificate_ids'])) {
            $product->certificates()->sync($data['certificate_ids']);
        }
    }

    private function uniqueSlug(string $source): string
    {
        $base = Str::slug($source) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (Product::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
