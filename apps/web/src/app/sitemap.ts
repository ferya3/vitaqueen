import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { locales, localeTags, defaultLocale } from '@/i18n/routing';
import { staticRoutes } from '@/config/navigation';
import { getNews, getProducts } from '@/services/content';

const url = (path: string) => new URL(path, siteConfig.url).toString();

/**
 * One entry per URL, each carrying the full `hreflang` alternate set.
 *
 * Export markets are the whole reason the site is multilingual, so the sitemap
 * has to say explicitly which page is which language — otherwise the Russian
 * and Arabic versions compete with the English one instead of serving it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await getProducts(defaultLocale);
  const { data: articles } = await getNews(defaultLocale);

  const paths = [
    ...staticRoutes,
    ...products.map((product) => `/products/${product.slug}`),
    ...articles.map((article) => `/news/${article.slug}`),
  ];

  return locales.flatMap((locale) =>
    paths.map((path) => {
      const normalised = path === '/' ? '' : path;
      return {
        url: url(`/${locale}${normalised}`),
        lastModified: new Date(),
        changeFrequency: path.startsWith('/news') ? ('weekly' as const) : ('monthly' as const),
        priority: path === '/' ? 1 : path.startsWith('/products') ? 0.8 : 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((alternate) => [
              localeTags[alternate],
              url(`/${alternate}${normalised}`),
            ]),
          ),
        },
      };
    }),
  );
}
