<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            WaterAnalysisSeeder::class,
            ProductSeeder::class,
            ProductionStageSeeder::class,
        ]);

        // Deliberately absent: a CertificateSeeder. Certificates are only ever
        // entered by someone who is holding the actual document.
    }
}
