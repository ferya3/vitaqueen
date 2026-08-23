import 'server-only';
import { apiFetch, withFallback } from './api';
import {
  seedCertificates,
  seedDistributors,
  seedNews,
  seedProductionStages,
  seedProducts,
  seedSourceProfile,
  seedWaterAnalysis,
} from '@/content/seed';
import type {
  Certificate,
  Distributor,
  NewsArticle,
  Product,
  ProductionStage,
  SourceProfile,
  WaterAnalysis,
} from '@/types/content';
import type { Locale } from '@/i18n/routing';

/**
 * Everything the pages read goes through here.
 *
 * `seeded` travels with the payload rather than being inferred later, so a page
 * can tell the reader "these are sample figures" instead of quietly presenting
 * placeholder laboratory values as fact.
 */
export type Sourced<T> = { data: T; seeded: boolean };

async function load<T>(
  loader: () => Promise<T>,
  fallback: () => T,
  label: string,
): Promise<Sourced<T>> {
  let seeded = false;
  const data = await withFallback(loader, () => {
    seeded = true;
    return fallback();
  }, label);
  return { data, seeded };
}

export function getProducts(locale: Locale) {
  return load(
    () => apiFetch<Product[]>('/products', { locale, tags: ['products'] }),
    () => seedProducts(locale),
    'products',
  );
}

export async function getProduct(locale: Locale, slug: string) {
  return load(
    () => apiFetch<Product>(`/products/${slug}`, { locale, tags: ['products', `product:${slug}`] }),
    () => {
      const match = seedProducts(locale).find((product) => product.slug === slug);
      if (!match) throw new Error(`Unknown product: ${slug}`);
      return match;
    },
    `product:${slug}`,
  );
}

export function getCertificates(locale: Locale) {
  return load(
    () => apiFetch<Certificate[]>('/certificates', { locale, tags: ['certificates'] }),
    seedCertificates,
    'certificates',
  );
}

export function getWaterAnalysis(locale: Locale) {
  return load(
    () => apiFetch<WaterAnalysis>('/water-analysis', { locale, tags: ['water-analysis'] }),
    seedWaterAnalysis,
    'water-analysis',
  );
}

export function getSourceProfile(locale: Locale) {
  return load(
    () => apiFetch<SourceProfile>('/source', { locale, tags: ['source'] }),
    seedSourceProfile,
    'source',
  );
}

export function getProductionStages(locale: Locale) {
  return load(
    () => apiFetch<ProductionStage[]>('/production-stages', { locale, tags: ['factory'] }),
    seedProductionStages,
    'production-stages',
  );
}

export function getNews(locale: Locale, limit?: number) {
  const query = limit ? `?limit=${limit}` : '';
  return load(
    () => apiFetch<NewsArticle[]>(`/news${query}`, { locale, tags: ['news'], revalidate: 120 }),
    seedNews,
    'news',
  );
}

export async function getArticle(locale: Locale, slug: string) {
  return load(
    () => apiFetch<NewsArticle>(`/news/${slug}`, { locale, tags: ['news', `news:${slug}`] }),
    () => {
      throw new Error(`Unknown article: ${slug}`);
    },
    `news:${slug}`,
  );
}

export function getDistributors(locale: Locale) {
  return load(
    () => apiFetch<Distributor[]>('/distributors', { locale, tags: ['distributors'] }),
    seedDistributors,
    'distributors',
  );
}
