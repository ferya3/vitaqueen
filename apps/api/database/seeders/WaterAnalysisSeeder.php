<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SourceProfile;
use App\Models\WaterAnalysis;
use Illuminate\Database\Seeder;

/**
 * Seeds an *unpublished* analysis and the source profile that points at it.
 *
 * `is_published` is false on purpose. These are structural placeholders so the
 * admin panel and the API have something to work against; publishing them would
 * put invented laboratory values on a public page, which is precisely the
 * mistake this project is trying not to make. Replace the numbers with the real
 * certificate of analysis, then publish.
 */
class WaterAnalysisSeeder extends Seeder
{
    private const PLACEHOLDER_VALUES = [
        ['key' => 'calcium', 'value' => 62, 'unit' => 'mg/L', 'method' => 'ISO 6058'],
        ['key' => 'magnesium', 'value' => 26, 'unit' => 'mg/L', 'method' => 'ISO 6059'],
        ['key' => 'sodium', 'value' => 9.4, 'unit' => 'mg/L', 'method' => 'ISO 9964-3'],
        ['key' => 'potassium', 'value' => 1.8, 'unit' => 'mg/L', 'method' => 'ISO 9964-3'],
        ['key' => 'bicarbonate', 'value' => 288, 'unit' => 'mg/L', 'method' => 'Titration'],
        ['key' => 'sulfate', 'value' => 21, 'unit' => 'mg/L', 'limit_value' => 250, 'method' => 'ISO 10304-1'],
        ['key' => 'chloride', 'value' => 7.5, 'unit' => 'mg/L', 'limit_value' => 250, 'method' => 'ISO 10304-1'],
        ['key' => 'nitrate', 'value' => 2.1, 'unit' => 'mg/L', 'limit_value' => 50, 'method' => 'ISO 10304-1'],
        ['key' => 'silica', 'value' => 11.6, 'unit' => 'mg/L', 'method' => 'Spectrophotometry'],
        ['key' => 'fluoride', 'value' => 0.14, 'unit' => 'mg/L', 'limit_value' => 1.5, 'method' => 'ISO 10359-1'],
    ];

    public function run(): void
    {
        if (WaterAnalysis::exists()) {
            return;
        }

        $analysis = WaterAnalysis::create([
            'sampling_point' => 'Wellhead',
            'sampled_at' => now()->subMonth()->toDateString(),
            'laboratory' => null,
            'report_number' => null,
            'ph' => 7.4,
            'tds' => 342,
            'hardness' => 262,
            'temperature_c' => 9.6,
            'is_published' => false,
        ]);

        foreach (self::PLACEHOLDER_VALUES as $position => $value) {
            $analysis->values()->create([...$value, 'position' => $position]);
        }

        SourceProfile::create([
            'altitude_meters' => 2140,
            'latitude' => 36.0,
            'longitude' => 51.4,
            'source_type' => ['fa' => 'چشمه آرتزین', 'en' => 'Artesian spring', 'ar' => 'نبع ارتوازي', 'ru' => 'Артезианский источник'],
            'aquifer_age' => ['fa' => '۴۰+ سال', 'en' => '40+ years', 'ar' => '40+ سنة', 'ru' => '40+ лет'],
            'temperature_c' => 9.6,
            'ph' => 7.4,
            'tds' => 342,
            'hardness' => 262,
            'water_analysis_id' => $analysis->id,
        ]);
    }
}
