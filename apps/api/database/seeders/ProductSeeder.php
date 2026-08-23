<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * The five formats, in all four languages.
 *
 * These are real product facts (volumes, case counts, cap standards) rather
 * than invented marketing claims, so they are safe to publish. pH and TDS are
 * copied from the placeholder analysis and should be corrected alongside it.
 */
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $formats = [
            ['slug' => '330ml', 'volume' => 330, 'units' => 24, 'cases' => 108, 'cap' => 'PCO 1810, 26 mm'],
            ['slug' => '500ml', 'volume' => 500, 'units' => 12, 'cases' => 120, 'cap' => 'PCO 1810, 26 mm'],
            ['slug' => '1l', 'volume' => 1000, 'units' => 12, 'cases' => 84, 'cap' => 'PCO 1810, 30 mm'],
            ['slug' => '1-5l', 'volume' => 1500, 'units' => 6, 'cases' => 96, 'cap' => 'PCO 1810, 30 mm'],
            ['slug' => '5l', 'volume' => 5000, 'units' => 2, 'cases' => 60, 'cap' => 'Handle cap, 48 mm'],
        ];

        $names = [
            '330ml' => ['fa' => 'ویتاکوئین ۳۳۰ میلی‌لیتر', 'en' => 'VitaQueen 330 ml', 'ar' => 'فيتاكوين 330 مل', 'ru' => 'VitaQueen 330 мл'],
            '500ml' => ['fa' => 'ویتاکوئین ۵۰۰ میلی‌لیتر', 'en' => 'VitaQueen 500 ml', 'ar' => 'فيتاكوين 500 مل', 'ru' => 'VitaQueen 500 мл'],
            '1l' => ['fa' => 'ویتاکوئین ۱ لیتری', 'en' => 'VitaQueen 1 L', 'ar' => 'فيتاكوين 1 لتر', 'ru' => 'VitaQueen 1 л'],
            '1-5l' => ['fa' => 'ویتاکوئین ۱٫۵ لیتری', 'en' => 'VitaQueen 1.5 L', 'ar' => 'فيتاكوين 1.5 لتر', 'ru' => 'VitaQueen 1,5 л'],
            '5l' => ['fa' => 'ویتاکوئین ۵ لیتری', 'en' => 'VitaQueen 5 L', 'ar' => 'فيتاكوين 5 لتر', 'ru' => 'VitaQueen 5 л'],
        ];

        foreach ($formats as $position => $format) {
            Product::updateOrCreate(
                ['slug' => $format['slug']],
                [
                    'sku' => 'VQ-'.$format['volume'],
                    'name' => $names[$format['slug']],
                    'packaging' => [
                        'en' => "Shrink pack, {$format['units']} × ".($format['volume'] >= 1000 ? ($format['volume'] / 1000).' L' : $format['volume'].' ml'),
                    ],
                    'volume_ml' => $format['volume'],
                    'bottle_type' => 'PET, mono-material',
                    'cap_type' => $format['cap'],
                    'ph' => 7.4,
                    'tds' => 342,
                    'shelf_life_months' => 18,
                    'units_per_case' => $format['units'],
                    'cases_per_pallet' => $format['cases'],
                    'featured' => in_array($format['volume'], [500, 1500], true),
                    'is_published' => true,
                    'position' => $position,
                ],
            );
        }
    }
}
