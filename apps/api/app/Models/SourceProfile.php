<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Singleton: there is one spring, and the site describes that spring.
 * Modelled as a table anyway so edits are versioned by the audit log.
 */
class SourceProfile extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'altitude_meters', 'latitude', 'longitude', 'source_type', 'aquifer_age',
        'temperature_c', 'ph', 'tds', 'hardness', 'water_analysis_id',
    ];

    protected array $translatable = ['source_type', 'aquifer_age'];

    protected function casts(): array
    {
        return [
            'altitude_meters' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
            'temperature_c' => 'float',
            'ph' => 'float',
            'tds' => 'integer',
            'hardness' => 'integer',
        ];
    }

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(WaterAnalysis::class, 'water_analysis_id');
    }

    public static function current(): ?self
    {
        return static::query()->with('analysis.values')->first();
    }
}
