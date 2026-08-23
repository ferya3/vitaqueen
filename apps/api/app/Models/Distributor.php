<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Distributor extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'company', 'region', 'country', 'city', 'phone', 'email', 'website',
        'is_published', 'position',
    ];

    protected array $translatable = ['region'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean', 'position' => 'integer'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)->orderBy('position');
    }
}
