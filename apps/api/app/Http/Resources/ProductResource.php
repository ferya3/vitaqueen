<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Matches `Product` in `apps/web/src/types/content.ts`.
 *
 * `specs` and `nutrition` are assembled here rather than stored: they are
 * projections of columns the factory already maintains, and asking an editor to
 * retype "0 g of fat" into five product records is how those five records end
 * up disagreeing with each other.
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'volumeMl' => $this->volume_ml,
            'bottleType' => $this->bottle_type,
            'capType' => $this->cap_type,
            'packaging' => $this->packaging,
            'ph' => $this->ph,
            'tds' => $this->tds,
            'shelfLifeMonths' => $this->shelf_life_months,
            'unitsPerCase' => $this->units_per_case,
            'casesPerPallet' => $this->cases_per_pallet,
            'barcode' => $this->barcode,
            'images' => MediaResource::collection($this->whenLoaded('images')),
            'model3dUrl' => $this->model_3d_url,
            'datasheetUrl' => $this->whenLoaded('datasheet', fn () => $this->datasheet?->url()),
            'nutrition' => $this->nutrition(),
            'specs' => $this->specs(),
            'certificates' => CertificateResource::collection($this->whenLoaded('certificates')),
            'featured' => $this->featured,
            'order' => $this->position,
        ];
    }

    /** @return array<int, array{labelKey: string, value: string}> */
    private function specs(): array
    {
        return collect([
            'volume' => $this->volume_ml !== null ? "{$this->volume_ml} ml" : null,
            'bottleType' => $this->bottle_type,
            'capType' => $this->cap_type,
            'packaging' => $this->packaging,
            'ph' => $this->ph !== null ? (string) $this->ph : null,
            'tds' => $this->tds !== null ? "{$this->tds} mg/L" : null,
            'shelfLife' => $this->shelf_life_months !== null ? (string) $this->shelf_life_months : null,
            'unitsPerCase' => $this->units_per_case !== null ? (string) $this->units_per_case : null,
            'casesPerPallet' => $this->cases_per_pallet !== null ? (string) $this->cases_per_pallet : null,
            'barcode' => $this->barcode,
        ])
            ->filter(fn (?string $value) => filled($value))
            ->map(fn (string $value, string $key) => ['labelKey' => $key, 'value' => $value])
            ->values()
            ->all();
    }

    /** @return array<int, array{labelKey: string, value: string}> */
    private function nutrition(): array
    {
        return collect(config('vitaqueen.nutrition_per_100ml', []))
            ->map(fn (string $value, string $key) => ['labelKey' => $key, 'value' => $value])
            ->values()
            ->all();
    }
}
