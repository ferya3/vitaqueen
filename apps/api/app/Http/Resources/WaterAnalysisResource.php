<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WaterAnalysisValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WaterAnalysisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'samplingPoint' => $this->sampling_point,
            'sampledAt' => $this->sampled_at?->toDateString(),
            'laboratory' => $this->laboratory,
            'reportNumber' => $this->report_number,
            'ph' => $this->ph,
            'tds' => $this->tds,
            'hardness' => $this->hardness,
            'temperatureC' => $this->temperature_c,
            'minerals' => $this->whenLoaded('values', fn () => $this->values
                ->map(fn (WaterAnalysisValue $value) => [
                    'key' => $value->key,
                    // The frontend translates this against `source.minerals.*`,
                    // so the API never sends a display label.
                    'labelKey' => $value->key,
                    'value' => $value->value,
                    'unit' => $value->unit,
                    'limit' => $value->limit_value,
                    'method' => $value->method,
                ])->all()),
            'documentUrl' => $this->whenLoaded('document', fn () => $this->document?->url()),
        ];
    }
}
