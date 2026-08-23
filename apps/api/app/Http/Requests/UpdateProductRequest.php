<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateProductRequest extends StoreProductRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('product')) ?? false;
    }

    public function rules(): array
    {
        $rules = parent::rules();
        $id = $this->route('product')?->id;

        $rules['slug'] = ['sometimes', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('products', 'slug')->ignore($id)];
        $rules['sku'] = ['sometimes', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($id)];
        $rules['name'] = ['sometimes', 'array:'.implode(',', config('vitaqueen.locales'))];
        $rules['name.'.config('app.fallback_locale')] = ['sometimes', 'string', 'max:180'];
        $rules['volume_ml'] = ['sometimes', 'integer', 'min:50', 'max:20000'];

        return $rules;
    }
}
