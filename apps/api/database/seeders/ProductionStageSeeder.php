<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ProductionStage;
use Illuminate\Database\Seeder;

/**
 * The eight standard stages.
 *
 * No copy is seeded: the frontend already carries a translated description for
 * each of these keys under `factory.stages.*`. Rows exist so the order and the
 * per-stage media and metrics are editable without a deploy.
 */
class ProductionStageSeeder extends Seeder
{
    public function run(): void
    {
        $keys = [
            'waterSource', 'rawWater', 'treatment', 'qualityControl',
            'bottling', 'packaging', 'warehouse', 'distribution',
        ];

        foreach ($keys as $position => $key) {
            ProductionStage::updateOrCreate(
                ['key' => $key],
                ['position' => $position, 'is_published' => true],
            );
        }
    }
}
