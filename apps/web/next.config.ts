import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Never advertise the framework version to a scanner.
  poweredByHeader: false,

  images: {
    // AVIF first: a hero still drops from ~380 KB to ~120 KB at the same
    // perceived quality, which matters more here than anywhere else.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [64, 96, 128, 200, 320, 420],
    remotePatterns: process.env.NEXT_PUBLIC_MEDIA_HOST
      ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_MEDIA_HOST }]
      : [],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS is also set at the edge; duplicating it means a direct hit on
          // the origin is still protected.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Fingerprinted media can be cached hard; the CMS changes the filename.
        source: '/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
