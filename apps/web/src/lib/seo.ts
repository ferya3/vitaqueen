import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { locales, localeTags, defaultLocale, type Locale } from '@/i18n/routing';

type BuildMetadataInput = {
  locale: Locale;
  /** Locale-less pathname, e.g. `/products/still-500ml`. */
  path: string;
  title: string;
  description: string;
  siteName: string;
  imageAlt?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  noindex?: boolean;
};

function absolute(path: string) {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Every page's metadata goes through here so that canonical URLs, `hreflang`
 * alternates and Open Graph stay consistent across every locale served.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  siteName,
  image = '/media/og-default.jpg',
  imageAlt,
  type = 'website',
  publishedTime,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const normalised = path === '/' ? '' : path.replace(/\/$/, '');
  const canonical = absolute(`/${locale}${normalised}`);

  const languages = Object.fromEntries(
    locales.map((l) => [localeTags[l], absolute(`/${l}${normalised}`)]),
  );

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical,
      languages: {
        ...languages,
        // The fallback for any locale we do not serve: English while the site
        // is multilingual, and whatever the single served locale is otherwise.
        // Pointing `x-default` at a URL that 404s is worse than not sending it.
        'x-default': absolute(
          `/${locales.includes('en') ? 'en' : defaultLocale}${normalised}`,
        ),
      },
    },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      siteName,
      locale: localeTags[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeTags[l]),
      images: [{ url: absolute(image), width: 1200, height: 630, alt: imageAlt ?? title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absolute(image)],
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' },
  };
}
