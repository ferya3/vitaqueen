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
        <Reveal className="grid gap-4 sm:grid-cols-2" stagger={0.08}>
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar.key} className="glass rounded-2xl p-6 sm:p-8">
              <div id={pillar.anchor} className="scroll-mt-28">
                <p className="font-display text-3xl font-extrabold tabular text-aqua-500/80">
                  {t(`pillars.${pillar.key}.index`)}
                </p>
                <h2 className="mt-3 text-xl sm:text-2xl">{t(`pillars.${pillar.key}.title`)}</h2>
                <p className="mt-2.5 leading-relaxed text-ink-500">
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
          <TextReveal as="h2" className="mt-4 text-2xl text-white sm:text-3xl">
            {t('metrics.title')}
          </TextReveal>
          <p className="mt-3 leading-relaxed text-ink-200 sm:text-lg">{t('metrics.body')}</p>
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
