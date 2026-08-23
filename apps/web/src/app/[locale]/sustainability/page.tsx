import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

const PILLARS = [
  { key: 'p01', anchor: 'water-protection' },
  { key: 'p02', anchor: 'energy' },
  { key: 'p03', anchor: 'recycling' },
  { key: 'p04', anchor: 'environment' },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sustainability' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/sustainability',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function SustainabilityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'sustainability' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="mountain"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('sustainability'), path: '/sustainability' },
        ]}
      />

      <Section tone="canvas">
        <Reveal className="grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-2" stagger={0.08}>
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar.key} className="bg-canvas p-8 sm:p-12">
              <div id={pillar.anchor} className="scroll-mt-28">
                <p className="font-display text-4xl text-aqua-500 tabular">
                  {t(`pillars.${pillar.key}.index`)}
                </p>
                <h2 className="mt-5 font-display text-2xl text-abyss-900">
                  {t(`pillars.${pillar.key}.title`)}
                </h2>
                <p className="mt-4 leading-relaxed text-ink-muted">
                  {t(`pillars.${pillar.key}.body`)}
                </p>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section tone="deep">
        <div className="max-w-3xl">
          <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
          <TextReveal as="h2" className="mt-5 font-display text-3xl text-white">
            {t('metrics.title')}
          </TextReveal>
          <p className="mt-5 text-lg leading-relaxed text-mist-400">{t('metrics.body')}</p>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('sustainability'), path: '/sustainability' },
        ])}
      />
    </>
  );
}
