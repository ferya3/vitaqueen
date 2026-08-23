<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaterAnalysisValue extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'water_analysis_id', 'key', 'value', 'unit', 'limit_value', 'method', 'position',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'limit_value' => 'float',
            'position' => 'integer',
        ];
    }

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(WaterAnalysis::class, 'water_analysis_id');
    }
}
