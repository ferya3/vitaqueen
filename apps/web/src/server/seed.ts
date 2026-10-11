import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { now, transaction } from '../../db/core.mjs';
import { locales } from '@/i18n/routing';
import {
  SAMPLE_MINERALS,
  SAMPLE_PH,
  SAMPLE_TDS,
  STANDARD_STAGE_KEYS,
  productCopy,
  productFormats,
  sampleSourceText,
} from '@/content/samples';

const json = (value: unknown) => JSON.stringify(value);

/**
 * Fills a brand-new database with the sample catalogue.
 *
 * Runs once per database, ever: the marker in `meta` is written in the same
 * transaction as the rows, so a crash halfway leaves nothing behind and the
 * next start tries again, while an admin who deletes every sample product
 * does not get them back on the next restart.
 */
export function seedSampleContent(db: DatabaseSync) {
  transaction(
    db,
    () => {
      const done = db.prepare(`SELECT value FROM meta WHERE key = 'seeded_at'`).get();
      if (done) return;

      const timestamp = now();

      const insertProduct = db.prepare(`
        INSERT INTO products (slug, sku, name, tagline, description, packaging, volume_ml,
          bottle_type, cap_type, ph, tds, shelf_life_months, units_per_case, cases_per_pallet,
          featured, is_published, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `);

      productFormats.forEach((format, index) => {
        const field = (key: 'name' | 'tagline' | 'description') =>
          json(Object.fromEntries(locales.map((locale) => [locale, productCopy[locale][format.slug][key]])));

        insertProduct.run(
          format.slug,
          `VQ-${format.volumeMl}`,
          field('name'),
          field('tagline'),
          field('description'),
          json({ en: format.packaging }),
          format.volumeMl,
          'PET, mono-material',
          format.capType,
          SAMPLE_PH,
          SAMPLE_TDS,
          18,
          format.unitsPerCase,
          format.casesPerPallet,
          format.volumeMl === 500 || format.volumeMl === 1500 ? 1 : 0,
          index,
          timestamp,
          timestamp,
        );
      });

      const analysis = db
        .prepare(`
          INSERT INTO water_analyses (sampling_point, sampled_at, ph, tds, hardness, temperature_c,
            is_sample, is_published, created_at, updated_at)
          VALUES ('Wellhead', ?, ?, ?, 262, 9.6, 1, 1, ?, ?)
        `)
        .run(timestamp.slice(0, 10), SAMPLE_PH, SAMPLE_TDS, timestamp, timestamp);

      const insertValue = db.prepare(`
        INSERT INTO water_analysis_values (water_analysis_id, key, value, unit, limit_value, method, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      SAMPLE_MINERALS.forEach((mineral, index) => {
        insertValue.run(
          analysis.lastInsertRowid,
          mineral.key,
          mineral.value,
          mineral.unit,
          mineral.limit,
          mineral.method,
          index,
        );
      });

      db.prepare(`
        INSERT INTO source_profile (id, altitude_meters, latitude, longitude, source_type, aquifer_age,
          temperature_c, ph, tds, hardness, is_sample, updated_at)
        VALUES (1, 2140, 36.0, 51.4, ?, ?, 9.6, ?, ?, 262, 1, ?)
      `).run(
        json(sampleSourceText.sourceType),
        json(sampleSourceText.aquiferAge),
        SAMPLE_PH,
        SAMPLE_TDS,
        timestamp,
      );

      const insertStage = db.prepare(`
        INSERT INTO production_stages (key, is_published, position, created_at, updated_at)
        VALUES (?, 1, ?, ?, ?)
      `);
      STANDARD_STAGE_KEYS.forEach((key, index) => insertStage.run(key, index, timestamp, timestamp));

      // Legal pages exist as drafts so the admin panel has somewhere to write
      // them. They stay unpublished until a person has written the text: an
      // invented privacy policy is worse than an honest "not published yet".
      const insertPage = db.prepare(`
        INSERT INTO pages (slug, title, is_published, created_at, updated_at) VALUES (?, ?, 0, ?, ?)
      `);
      insertPage.run('privacy', json({ fa: 'حریم خصوصی', en: 'Privacy policy' }), timestamp, timestamp);
      insertPage.run('terms', json({ fa: 'شرایط استفاده', en: 'Terms of use' }), timestamp, timestamp);
      insertPage.run('cookies', json({ fa: 'سیاست کوکی', en: 'Cookie policy' }), timestamp, timestamp);

      db.prepare(`INSERT INTO meta (key, value) VALUES ('seeded_at', ?)`).run(timestamp);
    },
    { immediate: true },
  );
}
