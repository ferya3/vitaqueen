import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Never advertise the framework version to a scanner.
  poweredByHeader: false,

  // `next dev` refuses cross-origin requests for its own chunks and HMR socket,
  // so a dev server reached at `http://<vps-ip>:3000` serves the HTML and then
  // 403s every script. Naming the host here is what unblocks it — comma
  // separated, development only, and empty by default so nothing is widened
  // for a deployment that does not need it.
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

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

  // HSTS used to be declared here, for every path. It moved to `src/proxy.ts`,
  // which sends it only when the request actually arrived over TLS: this
  // function runs once at build time, so it cannot see the scheme of anything,
  // and a two-year HTTPS promise from an origin that has no TLS listener is one
  // the deployment cannot keep.
  async headers() {
    return [
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
