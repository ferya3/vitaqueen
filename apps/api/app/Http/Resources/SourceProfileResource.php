<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WaterAnalysisValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SourceProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'altitudeMeters' => $this->altitude_meters,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'sourceType' => $this->source_type,
            'aquiferAge' => $this->aquifer_age,
            'temperatureC' => $this->temperature_c,
            'ph' => $this->ph,
            'tds' => $this->tds,
            'hardness' => $this->hardness,
            // The mineral signature always comes from a real analysis record —
            // there is no second place to type these numbers into.
            'minerals' => $this->analysis?->values
                ->map(fn (WaterAnalysisValue $value) => [
                    'key' => $value->key,
                    'labelKey' => $value->key,
                    'value' => $value->value,
                    'unit' => $value->unit,
                    'limit' => $value->limit_value,
                    'method' => $value->method,
                ])->all() ?? [],
        ];
    }
}
