import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ProcessSequence } from '@/components/factory/ProcessSequence';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema';
import { getProductionStages } from '@/services/content';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'factory' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/factory',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function FactoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'factory' });
  const stages = await getTranslations({ locale, namespace: 'factory.stages' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  const { data: productionStages } = await getProductionStages(locale);

  const detailSections = [
    { id: 'filtration', key: 'treatment', label: nav('factoryFiltration') },
    { id: 'bottling', key: 'bottling', label: nav('factoryBottling') },
    { id: 'quality-control', key: 'qualityControl', label: nav('factoryControl') },
    { id: 'laboratory', key: 'qualityControl', label: nav('factoryLaboratory') },
  ] as const;

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="line"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('factory'), path: '/factory' },
        ]}
      />

      <ProcessSequence stages={productionStages} />

      <Section tone="canvas">
        <Reveal className="grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-2" stagger={0.07}>
          {detailSections.map((section) => (
            <RevealItem key={section.id} className="bg-canvas p-8 sm:p-10">
              <div id={section.id} className="scroll-mt-28">
                <Eyebrow>{section.label}</Eyebrow>
                <TextReveal as="h2" className="mt-4 font-display text-2xl text-abyss-900">
                  {stages(`${section.key}.title`)}
                </TextReveal>
                <p className="mt-4 leading-relaxed text-ink-muted">{stages(`${section.key}.body`)}</p>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <JsonLd
        data={[
          localBusinessSchema(locale, t('lead')),
          breadcrumbSchema(locale, [
            { name: nav('home'), path: '/' },
            { name: nav('factory'), path: '/factory' },
          ]),
        ]}
      />
    </>
  );
}
