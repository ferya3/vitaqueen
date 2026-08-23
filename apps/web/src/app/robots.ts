import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  // A staging deployment that gets indexed outranks production for its own
  // brand name, so anything that is not the canonical host stays closed.
  const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';

  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/api/', '/legal/'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: isProduction ? `${siteConfig.url}/sitemap.xml` : undefined,
    host: siteConfig.url,
  };
}
