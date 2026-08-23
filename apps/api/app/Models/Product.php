<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use Auditable, HasTranslations, SoftDeletes;

    protected $fillable = [
        'slug', 'sku', 'name', 'tagline', 'description', 'volume_ml',
        'bottle_type', 'cap_type', 'packaging', 'ph', 'tds', 'shelf_life_months',
        'units_per_case', 'cases_per_pallet', 'barcode', 'datasheet_media_id',
        'model_3d_url', 'featured', 'is_published', 'position',
    ];

    protected array $translatable = ['name', 'tagline', 'description', 'packaging'];

    protected function casts(): array
    {
        return [
            'volume_ml' => 'integer',
            'tds' => 'integer',
            'ph' => 'float',
            'shelf_life_months' => 'integer',
            'units_per_case' => 'integer',
            'cases_per_pallet' => 'integer',
            'featured' => 'boolean',
            'is_published' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function images(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'product_media')
            ->withPivot('position')
            ->orderBy('product_media.position');
    }

    public function certificates(): BelongsToMany
    {
        return $this->belongsToMany(Certificate::class);
    }

    public function datasheet(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'datasheet_media_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)->orderBy('position');
    }
}
