import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Manrope, Vazirmatn } from 'next/font/google';

import '../globals.css';

import { routing, getDirection, localeTags, type Locale } from '@/i18n/routing';
import { siteConfig } from '@/config/site';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { organizationSchema, websiteSchema } from '@/lib/schema';

/** Latin display + text face. Variable, so one file covers the whole scale. */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

/** Persian and Arabic face. Vazirmatn has proper Persian digits and kashida. */
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#030d18' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${t('siteName')} — ${t('tagline')}`,
      template: `%s — ${t('siteName')}`,
    },
    description: t('description'),
    applicationName: t('siteName'),
    referrer: 'strict-origin-when-cross-origin',
    formatDetection: { telephone: false, address: false, email: false },
    icons: { icon: '/favicon.ico' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering of every page under this segment.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'meta' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const direction = getDirection(locale);
  // The middleware puts the CSP nonce here, and our inline JSON-LD needs it.
  //
  // Reading a request header opts the whole segment into dynamic rendering.
  // That is a deliberate trade: a per-request nonce is what lets the CSP stay
  // free of `unsafe-inline`, and the HTML is cached at the edge instead (see
  // `infra/nginx/vitaqueen.conf` and `docs/security.md`). Data fetching is
  // still cached by tag, so a dynamic render is cheap.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  const isArabicScript = locale === 'fa' || locale === 'ar';

  return (
    <html
      lang={localeTags[locale as Locale]}
      dir={direction}
      className={`${manrope.variable} ${vazirmatn.variable}`}
      style={
        {
          // Bind the design system's font tokens to the right face for this
          // locale, once, at the document root.
          '--font-brand-display': isArabicScript
            ? 'var(--font-arabic)'
            : 'var(--font-latin)',
          '--font-brand-sans': isArabicScript
            ? 'var(--font-arabic)'
            : 'var(--font-latin)',
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-abyss-900 px-4 py-2 text-mist-50 focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-200"
        >
          {common('skipToContent')}
        </a>

        <NextIntlClientProvider>
          <MotionProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </MotionProvider>
        </NextIntlClientProvider>

        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema(locale as Locale, t('description')),
              websiteSchema(locale as Locale, t('siteName')),
            ]),
          }}
        />
      </body>
    </html>
  );
}
