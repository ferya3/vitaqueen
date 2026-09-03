import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { SourceMap } from '@/components/source/SourceMap';
import { MineralChart } from '@/components/source/MineralChart';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { Reveal } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getSourceProfile } from '@/services/content';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'source' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/source',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function SourcePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'source' });
  const facts = await getTranslations({ locale, namespace: 'source.facts' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  const { data: profile, seeded } = await getSourceProfile(locale);

  const factRows: Array<[string, string]> = [
    [facts('altitude'), `${formatNumber(profile.altitudeMeters, locale)} m`],
    [
      facts('coordinates'),
      `${formatNumber(profile.latitude, locale, { maximumFractionDigits: 4 })}, ${formatNumber(profile.longitude, locale, { maximumFractionDigits: 4 })}`,
    ],
    [facts('type'), profile.sourceType],
    [facts('age'), profile.aquiferAge],
    [facts('temperature'), `${formatNumber(profile.temperatureC, locale)} °C`],
    [facts('ph'), formatNumber(profile.ph, locale)],
    [facts('tds'), `${formatNumber(profile.tds, locale)} mg/L`],
    [facts('hardness'), `${formatNumber(profile.hardness, locale)} mg/L`],
  ];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="spring"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('source'), path: '/source' },
        ]}
      />

      <Section tone="canvas" id="spring">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-4">
            <div className="glass rounded-2xl p-6 sm:p-8">
              <Eyebrow>{nav('sourceSpring')}</Eyebrow>
              <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
                {t('spring.title')}
              </TextReveal>
              <Reveal>
                <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('spring.body')}</p>
              </Reveal>
            </div>

            <div id="geography" className="glass scroll-mt-28 rounded-2xl p-6 sm:p-8">
              <Eyebrow>{nav('sourceGeography')}</Eyebrow>
              <h2 className="mt-4 text-2xl sm:text-3xl">{t('geography.title')}</h2>
              <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('geography.body')}</p>
            </div>
          </div>

          <SourceMap
            altitude={`${formatNumber(profile.altitudeMeters, locale)} m`}
            className="aspect-4/3"
          />
        </div>
      </Section>

      <Section tone="deep" id="characteristics">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <Eyebrow tone="light">{nav('sourceCharacteristics')}</Eyebrow>
            <TextReveal as="h2" className="mt-5 font-display text-3xl text-white">
              {t('characteristics.title')}
            </TextReveal>
            <p className="mt-5 max-w-md leading-relaxed text-ink-300">
              {t('characteristics.body')}
            </p>

            <dl className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {factRows.map(([label, value]) => (
                <div key={label} className="border-b border-white/10 pb-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ink-400">{label}</dt>
                  <dd className="mt-1.5 text-lg text-aqua-300 tabular">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="font-display text-2xl text-white">{t('minerals.title')}</h3>
            <p className="mt-3 text-sm text-ink-400">{t('minerals.body')}</p>
            <MineralChart minerals={profile.minerals} tone="light" columns={1} className="mt-8" />
            {seeded ? (
              <SeedNotice
                message={common('sampleData')}
                className="mt-8 border-white/20 bg-white/5 text-ink-300"
              />
            ) : null}
          </div>
        </div>
      </Section>

      <Section tone="canvas" id="protection">
        <div className="glass max-w-3xl rounded-2xl p-6 sm:p-9">
          <Eyebrow>{nav('sourceProtection')}</Eyebrow>
          <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
            {t('protection.title')}
          </TextReveal>
          <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('protection.body')}</p>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('source'), path: '/source' },
        ])}
      />
    </>
  );
}
