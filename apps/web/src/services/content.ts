import 'server-only';
import { all, get } from '@/server/db';
import { pick, pickOrNull } from '@/server/translations';
import { renderMarkup } from '@/server/markup';
import { mediaUrl } from '@/server/media-url';
import { seedProductionStages, seedSourceProfile, seedWaterAnalysis } from '@/content/samples';
import type {
  Certificate,
  Distributor,
  MediaAsset,
  MineralValue,
  NewsArticle,
  Product,
  ProductionStage,
  SourceProfile,
  WaterAnalysis,
} from '@/types/content';
import type { Locale } from '@/i18n/routing';

/**
 * Everything the public pages read goes through here.
 *
 * The database is local and synchronous, so these are plain queries; they stay
 * `async` so the pages do not care where content comes from. `seeded` travels
 * with the payload so a page can tell the reader "these are sample figures"
 * instead of quietly presenting placeholder laboratory values as fact.
 */
export type Sourced<T> = { data: T; seeded: boolean };

type Raw = Record<string, unknown>;

const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
const str = (value: unknown) => (value === null || value === undefined || value === '' ? null : String(value));

/** Nutrition is identical for every format because it is the same water. */
const NUTRITION = [
  { labelKey: 'energy', value: '0 kJ / 0 kcal' },
  { labelKey: 'fat', value: '0 g' },
  { labelKey: 'carbohydrate', value: '0 g' },
  { labelKey: 'protein', value: '0 g' },
  { labelKey: 'salt', value: process.env.SALT_PER_100ML || '0.02 g' },
];

function mediaAsset(row: Raw | undefined, locale: Locale, fallbackAlt = ''): MediaAsset | null {
  if (!row?.path) return null;
  return {
    src: mediaUrl(String(row.path)),
    alt: pick(row.alt, locale) || fallbackAlt,
    width: num(row.width) ?? undefined,
    height: num(row.height) ?? undefined,
  };
}

function mediaById(id: unknown, locale: Locale, fallbackAlt = '') {
  if (id === null || id === undefined) return null;
  return mediaAsset(get<Raw>('SELECT * FROM media WHERE id = ?', [Number(id)]), locale, fallbackAlt);
}

function documentUrl(id: unknown) {
  if (id === null || id === undefined) return null;
  const row = get<Raw>('SELECT path FROM media WHERE id = ?', [Number(id)]);
  return row ? mediaUrl(String(row.path)) : null;
}

// --- Certificates -------------------------------------------------------------

function toCertificate(row: Raw, locale: Locale): Certificate {
  const title = pick(row.title, locale);
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title,
    issuer: pick(row.issuer, locale),
    number: str(row.number),
    scope: pickOrNull(row.scope, locale),
    issuedAt: str(row.issued_at),
    validUntil: str(row.valid_until),
    logo: mediaById(row.logo_media_id, locale, title),
    documentUrl: documentUrl(row.document_media_id),
  };
}

/** Published, and not expired: a lapsed certificate is not shown as held. */
const LIVE_CERTIFICATE = `is_published = 1 AND (valid_until IS NULL OR valid_until >= date('now'))`;

export async function getCertificates(locale: Locale): Promise<Sourced<Certificate[]>> {
  const rows = all<Raw>(`SELECT * FROM certificates WHERE ${LIVE_CERTIFICATE} ORDER BY position, id`);
  return { data: rows.map((row) => toCertificate(row, locale)), seeded: false };
}

// --- Products -------------------------------------------------------------------

function toProduct(row: Raw, locale: Locale): Product {
  const name = pick(row.name, locale);
  const packaging = pick(row.packaging, locale);
  const id = Number(row.id);

  const images = all<Raw>(
    `SELECT m.* FROM product_media pm JOIN media m ON m.id = pm.media_id
     WHERE pm.product_id = ? ORDER BY pm.position, m.id`,
    [id],
  )
    .map((media) => mediaAsset(media, locale, name))
    .filter((media): media is MediaAsset => media !== null);

  const certificates = all<Raw>(
    `SELECT c.* FROM certificate_product cp JOIN certificates c ON c.id = cp.certificate_id
     WHERE cp.product_id = ? AND c.is_published = 1
       AND (c.valid_until IS NULL OR c.valid_until >= date('now'))
     ORDER BY c.position, c.id`,
    [id],
  ).map((certificate) => toCertificate(certificate, locale));

  const volumeMl = Number(row.volume_ml);
  const ph = num(row.ph);
  const tds = num(row.tds);

  // Derived from the typed columns, so the spec sheet cannot disagree with the
  // fields an editor actually maintains.
  const specs = [
    { labelKey: 'volume', value: `${volumeMl} ml` },
    { labelKey: 'bottleType', value: str(row.bottle_type) },
    { labelKey: 'capType', value: str(row.cap_type) },
    { labelKey: 'packaging', value: packaging || null },
    { labelKey: 'ph', value: ph === null ? null : String(ph) },
    { labelKey: 'tds', value: tds === null ? null : `${tds} mg/L` },
    { labelKey: 'shelfLife', value: str(row.shelf_life_months) },
    { labelKey: 'unitsPerCase', value: str(row.units_per_case) },
    { labelKey: 'casesPerPallet', value: str(row.cases_per_pallet) },
  ].filter((spec): spec is { labelKey: string; value: string } => spec.value !== null);

  return {
    id,
    slug: String(row.slug),
    sku: String(row.sku),
    name,
    tagline: pickOrNull(row.tagline, locale),
    description: pick(row.description, locale),
    volumeMl,
    bottleType: str(row.bottle_type) ?? '',
    capType: str(row.cap_type) ?? '',
    packaging,
    ph: ph ?? 0,
    tds: tds ?? 0,
    shelfLifeMonths: num(row.shelf_life_months) ?? 0,
    unitsPerCase: num(row.units_per_case),
    casesPerPallet: num(row.cases_per_pallet),
    barcode: str(row.barcode),
    images,
    model3dUrl: str(row.model_3d_url),
    datasheetUrl: documentUrl(row.datasheet_media_id),
    nutrition: NUTRITION,
    specs,
    certificates,
    featured: Number(row.featured) === 1,
    order: Number(row.position),
  };
}

export async function getProducts(locale: Locale): Promise<Sourced<Product[]>> {
  const rows = all<Raw>('SELECT * FROM products WHERE is_published = 1 ORDER BY position, id');
  return { data: rows.map((row) => toProduct(row, locale)), seeded: false };
}

export async function getProduct(locale: Locale, slug: string): Promise<Sourced<Product>> {
  const row = get<Raw>('SELECT * FROM products WHERE slug = ? AND is_published = 1', [slug]);
  if (!row) throw new Error(`Unknown product: ${slug}`);
  return { data: toProduct(row, locale), seeded: false };
}

export function listProductSlugs(): string[] {
  return all<{ slug: string }>('SELECT slug FROM products WHERE is_published = 1').map((row) => row.slug);
}

// --- Water ------------------------------------------------------------------------

function mineralsFor(analysisId: number): MineralValue[] {
  return all<Raw>(
    'SELECT * FROM water_analysis_values WHERE water_analysis_id = ? ORDER BY position, key',
    [analysisId],
  ).map((row) => ({
    key: String(row.key),
    labelKey: String(row.key),
    value: Number(row.value),
    unit: String(row.unit),
    limit: num(row.limit_value),
    method: str(row.method),
  }));
}

function latestAnalysis() {
  return get<Raw>('SELECT * FROM water_analyses WHERE is_published = 1 ORDER BY sampled_at DESC, id DESC LIMIT 1');
}

export async function getWaterAnalysis(locale: Locale): Promise<Sourced<WaterAnalysis>> {
  void locale;
  const row = latestAnalysis();
  if (!row) return { data: seedWaterAnalysis(), seeded: true };

  return {
    data: {
      id: Number(row.id),
      samplingPoint: String(row.sampling_point),
      sampledAt: String(row.sampled_at),
      laboratory: str(row.laboratory),
      reportNumber: str(row.report_number),
      ph: Number(row.ph),
      tds: Number(row.tds),
      hardness: num(row.hardness),
      temperatureC: num(row.temperature_c),
      minerals: mineralsFor(Number(row.id)),
      documentUrl: documentUrl(row.document_media_id),
    },
    seeded: Number(row.is_sample) === 1,
  };
}

export async function getSourceProfile(locale: Locale): Promise<Sourced<SourceProfile>> {
  const row = get<Raw>('SELECT * FROM source_profile WHERE id = 1');
  if (!row) return { data: seedSourceProfile(locale), seeded: true };

  // The mineral signature is the latest published analysis, so the source page
  // and the quality page always quote the same laboratory result.
  const analysis = latestAnalysis();
  const minerals = analysis ? mineralsFor(Number(analysis.id)) : seedSourceProfile(locale).minerals;

  return {
    data: {
      altitudeMeters: Number(row.altitude_meters),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      sourceType: pick(row.source_type, locale),
      aquiferAge: pick(row.aquifer_age, locale),
      temperatureC: Number(row.temperature_c),
      ph: Number(row.ph),
      tds: Number(row.tds),
      hardness: Number(row.hardness),
      minerals,
    },
    seeded: Number(row.is_sample) === 1 || !analysis || Number(analysis.is_sample) === 1,
  };
}

// --- Factory ------------------------------------------------------------------------

export async function getProductionStages(locale: Locale): Promise<Sourced<ProductionStage[]>> {
  const rows = all<Raw>('SELECT * FROM production_stages WHERE is_published = 1 ORDER BY position, id');
  if (rows.length === 0) return { data: seedProductionStages(), seeded: true };

  return {
    data: rows.map((row) => {
      const title = pickOrNull(row.title, locale);
      const webm = str(row.video_webm_url);
      const mp4 = str(row.video_mp4_url);
      const media = mediaById(row.media_id, locale, title ?? '');
      const sources = [
        ...(webm ? [{ src: webm, type: 'video/webm' as const }] : []),
        ...(mp4 ? [{ src: mp4, type: 'video/mp4' as const }] : []),
      ];

      return {
        key: String(row.key),
        order: Number(row.position),
        // An editor's own title wins; otherwise one of the eight standard
        // stages is labelled from the message catalogue.
        titleKey: title ? undefined : String(row.key),
        title: title ?? undefined,
        body: pickOrNull(row.body, locale) ?? undefined,
        media,
        video: sources.length > 0 ? { sources, poster: media?.src ?? '' } : null,
        metrics: [],
      };
    }),
    seeded: false,
  };
}

// --- News -----------------------------------------------------------------------------

const LIVE_ARTICLE = `is_published = 1 AND published_at IS NOT NULL AND published_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

function toArticle(row: Raw, locale: Locale, withBody: boolean): NewsArticle {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: pick(row.title, locale),
    excerpt: pick(row.excerpt, locale),
    body: withBody ? renderMarkup(pick(row.body, locale)) : '',
    cover: mediaById(row.cover_media_id, locale)?.src ?? null,
    publishedAt: String(row.published_at),
    updatedAt: str(row.updated_at),
    tags: (() => {
      try {
        const tags = JSON.parse(String(row.tags ?? '[]')) as unknown;
        return Array.isArray(tags) ? tags.map(String) : [];
      } catch {
        return [];
      }
    })(),
  };
}

export async function getNews(locale: Locale, limit?: number): Promise<Sourced<NewsArticle[]>> {
  const rows = all<Raw>(
    `SELECT * FROM news_articles WHERE ${LIVE_ARTICLE} ORDER BY published_at DESC, id DESC LIMIT ?`,
    [limit ?? -1],
  );
  return { data: rows.map((row) => toArticle(row, locale, false)), seeded: false };
}

export async function getArticle(locale: Locale, slug: string): Promise<Sourced<NewsArticle>> {
  const row = get<Raw>(`SELECT * FROM news_articles WHERE slug = ? AND ${LIVE_ARTICLE}`, [slug]);
  if (!row) throw new Error(`Unknown article: ${slug}`);
  return { data: toArticle(row, locale, true), seeded: false };
}

// --- Pages and distributors ---------------------------------------------------------

export type CmsPage = { title: string; body: string; description: string | null; updatedAt: string };

export async function getPage(locale: Locale, slug: string): Promise<CmsPage | null> {
  const row = get<Raw>('SELECT * FROM pages WHERE slug = ? AND is_published = 1', [slug]);
  if (!row) return null;
  return {
    title: pick(row.title, locale),
    body: renderMarkup(pick(row.body, locale)),
    description: pickOrNull(row.meta_description, locale),
    updatedAt: String(row.updated_at),
  };
}

export async function getDistributors(locale: Locale): Promise<Sourced<Distributor[]>> {
  const rows = all<Raw>('SELECT * FROM distributors WHERE is_published = 1 ORDER BY position, company');
  return {
    data: rows.map((row) => ({
      id: Number(row.id),
      company: String(row.company),
      region: pick(row.region, locale),
      country: String(row.country),
      city: str(row.city),
      phone: str(row.phone),
      email: str(row.email),
      website: str(row.website),
    })),
    seeded: false,
  };
}
