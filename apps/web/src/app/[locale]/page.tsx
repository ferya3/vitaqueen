import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Hero } from '@/components/hero/Hero';
import { SourceTeaser } from '@/components/home/SourceTeaser';
import { ProductRail } from '@/components/products/ProductRail';
import { QualityTeaser } from '@/components/home/QualityTeaser';
import { ContactCta } from '@/components/home/ContactCta';

import { getProducts, getSourceProfile } from '@/services/content';
import { buildMetadata } from '@/lib/seo';
import { formatNumber } from '@/lib/format';
import { localBusinessSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/',
    title: `${t('siteName')} — ${t('tagline')}`,
    description: t('description'),
    siteName: t('siteName'),
    imageAlt: t('ogAlt'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [source, products] = await Promise.all([
    getSourceProfile(locale),
    getProducts(locale),
  ]);

  const t = await getTranslations({ locale, namespace: 'meta' });
  const facts = await getTranslations({ locale, namespace: 'source.facts' });

  // Three measured facts, carried straight into the hero. A visitor should be
  // able to judge the water before scrolling once.
  const highlights = [
    {
      label: facts('altitude'),
      value: `${formatNumber(source.data.altitudeMeters, locale)} m`,
    },
    { label: facts('ph'), value: formatNumber(source.data.ph, locale) },
    { label: facts('tds'), value: `${formatNumber(source.data.tds, locale)} mg/L` },
  ];

  return (
    <>
      {/* Five sections, roughly five screens: the claim, the range, the source,
          the evidence, the ask. Anything that did not earn its screen height is
          on its own page instead. */}
      <Hero backdrop="spring" scene highlights={highlights} />

      <ProductRail products={products.data} />

      <SourceTeaser locale={locale} profile={source.data} seeded={source.seeded} />

      <QualityTeaser locale={locale} />

      <ContactCta locale={locale} />

      <JsonLd data={localBusinessSchema(locale, t('description'))} />
    </>
  );
}
