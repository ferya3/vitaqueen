<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WaterAnalysis extends Model
{
    use Auditable;

    protected $table = 'water_analyses';

    protected $fillable = [
        'sampling_point', 'sampled_at', 'laboratory', 'report_number',
        'ph', 'tds', 'hardness', 'temperature_c', 'document_media_id', 'is_published',
    ];

    protected function casts(): array
    {
        return [
            'sampled_at' => 'date',
            'ph' => 'float',
            'tds' => 'integer',
            'hardness' => 'integer',
            'temperature_c' => 'float',
            'is_published' => 'boolean',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(WaterAnalysisValue::class)->orderBy('position');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'document_media_id');
    }

    /** The published analysis the public site shows: the most recent one. */
    public function scopeLatestPublished(Builder $query): Builder
    {
        return $query->where('is_published', true)->latest('sampled_at');
    }
}
