<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Product::class) ?? false;
    }

    public function rules(): array
    {
        $locales = config('vitaqueen.locales');
        $fallback = config('app.fallback_locale');

        return [
            'slug' => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('products', 'slug')],
            'sku' => ['required', 'string', 'max:64', Rule::unique('products', 'sku')],

            // Translatable fields arrive as { "fa": "…", "en": "…" }. The
            // fallback locale is mandatory so nothing can be published with no
            // readable name at all.
            // `array:fa,en,…` rejects a typo'd locale key instead of silently
            // creating a fifth language nobody serves.
            'name' => ['required', 'array:'.implode(',', $locales)],
            'name.'.$fallback => ['required', 'string', 'max:180'],
            'name.*' => ['nullable', 'string', 'max:180'],
            'tagline' => ['nullable', 'array:'.implode(',', $locales)],
            'tagline.*' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'array:'.implode(',', $locales)],
            'description.*' => ['nullable', 'string', 'max:2000'],
            'packaging' => ['nullable', 'array:'.implode(',', $locales)],
            'packaging.*' => ['nullable', 'string', 'max:200'],

            'volume_ml' => ['required', 'integer', 'min:50', 'max:20000'],
            'bottle_type' => ['nullable', 'string', 'max:120'],
            'cap_type' => ['nullable', 'string', 'max:120'],
            'ph' => ['nullable', 'numeric', 'between:0,14'],
            'tds' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'shelf_life_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'units_per_case' => ['nullable', 'integer', 'min:1', 'max:500'],
            'cases_per_pallet' => ['nullable', 'integer', 'min:1', 'max:500'],
            'barcode' => ['nullable', 'string', 'max:32', 'regex:/^[0-9]+$/'],

            'datasheet_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'model_3d_url' => ['nullable', 'url', 'max:255'],
            'media_ids' => ['nullable', 'array', 'max:12'],
            'media_ids.*' => ['integer', Rule::exists('media', 'id')],
            'certificate_ids' => ['nullable', 'array', 'max:20'],
            'certificate_ids.*' => ['integer', Rule::exists('certificates', 'id')],

            'featured' => ['boolean'],
            'is_published' => ['boolean'],
            'position' => ['integer', 'min:0', 'max:999'],
        ];
    }
}
