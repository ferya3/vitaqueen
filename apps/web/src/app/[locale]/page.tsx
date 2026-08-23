import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Hero } from '@/components/hero/Hero';
import { JourneySequence } from '@/components/home/JourneySequence';
import { StoryChapter } from '@/components/home/StoryChapter';
import { SourceTeaser } from '@/components/home/SourceTeaser';
import { ProductRail } from '@/components/products/ProductRail';
import { TrustTeaser } from '@/components/home/TrustTeaser';
import { ClosingCta } from '@/components/home/ClosingCta';

import { getProducts, getSourceProfile } from '@/services/content';
import { buildMetadata } from '@/lib/seo';
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

  return (
    <>
      {/* The home page is the brand experience: hero, then the water's journey,
          then the five story chapters, then the evidence, then the ask. */}
      <Hero backdrop="spring" scene />

      <JourneySequence />

      <StoryChapter chapter="s01" backdrop="mountain" />
      <StoryChapter chapter="s02" backdrop="spring" flip />
      <StoryChapter chapter="s03" backdrop="mountain" />

      <SourceTeaser locale={locale} profile={source.data} seeded={source.seeded} />

      <StoryChapter chapter="s04" backdrop="lab" flip />
      <StoryChapter chapter="s05" backdrop="line" />

      <ProductRail products={products.data} />

      <TrustTeaser locale={locale} />

      <ClosingCta locale={locale} />

      <JsonLd data={localBusinessSchema(locale, t('description'))} />
    </>
  );
}
