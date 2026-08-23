import { siteConfig } from '@/config/site';
import { locales, type Locale } from '@/i18n/routing';
import type { Product, NewsArticle, WaterAnalysis } from '@/types/content';

const url = (path: string) => new URL(path, siteConfig.url).toString();

export function organizationSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': url('/#organization'),
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: url(`/${locale}`),
    logo: url('/media/logo.svg'),
    email: siteConfig.email,
    telephone: siteConfig.phone,
    description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: siteConfig.address.country,
      addressLocality: siteConfig.address.city || undefined,
      addressRegion: siteConfig.address.region || undefined,
      streetAddress: siteConfig.address.street || undefined,
      postalCode: siteConfig.address.postalCode || undefined,
    },
    sameAs: Object.values(siteConfig.social).filter(Boolean),
  };
}

export function websiteSchema(locale: Locale, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': url('/#website'),
    name,
    url: url(`/${locale}`),
    inLanguage: locales,
    publisher: { '@id': url('/#organization') },
  };
}

export function localBusinessSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url('/#plant'),
    name: siteConfig.legalName,
    description,
    url: url(`/${locale}/factory`),
    telephone: siteConfig.phone,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.spring.latitude,
      longitude: siteConfig.spring.longitude,
      elevation: siteConfig.spring.altitudeMeters,
    },
    address: { '@type': 'PostalAddress', addressCountry: siteConfig.address.country },
  };
}

export function productSchema(product: Product, locale: Locale, analysis?: WaterAnalysis) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    gtin13: product.barcode || undefined,
    image: product.images.map((i) => url(i.src)),
    brand: { '@type': 'Brand', name: siteConfig.name },
    manufacturer: { '@id': url('/#organization') },
    url: url(`/${locale}/products/${product.slug}`),
    category: 'Natural mineral water',
    // Mineral values are the honest, checkable part of a water product page.
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Volume', value: `${product.volumeMl} ml` },
      { '@type': 'PropertyValue', name: 'pH', value: String(product.ph) },
      { '@type': 'PropertyValue', name: 'TDS', value: `${product.tds} mg/L` },
      ...(analysis?.minerals ?? []).map((m) => ({
        '@type': 'PropertyValue',
        name: m.key,
        value: `${m.value} ${m.unit}`,
      })),
    ],
  };
}

export function articleSchema(article: NewsArticle, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    image: article.cover ? [url(article.cover)] : undefined,
    author: { '@id': url('/#organization') },
    publisher: { '@id': url('/#organization') },
    mainEntityOfPage: url(`/${locale}/news/${article.slug}`),
    inLanguage: locale,
  };
}

export function breadcrumbSchema(
  locale: Locale,
  trail: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: url(`/${locale}${item.path === '/' ? '' : item.path}`),
    })),
  };
}
