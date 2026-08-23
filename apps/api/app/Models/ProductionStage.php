<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionStage extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'key', 'title', 'body', 'metrics', 'media_id',
        'video_webm_url', 'video_mp4_url', 'is_published', 'position',
    ];

    protected array $translatable = ['title', 'body'];

    protected function casts(): array
    {
        return [
            // [{ "labelKey": "capacity", "value": "24,000 bph" }, …]
            'metrics' => 'array',
            'is_published' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)->orderBy('position');
    }
}
