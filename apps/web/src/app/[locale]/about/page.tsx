import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Stat } from '@/components/ui/Stat';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getSourceProfile } from '@/services/content';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/about',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'about' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const source = await getSourceProfile(locale);

  const blocks = ['company', 'history', 'vision', 'mission', 'management'] as const;

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="mountain"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('about'), path: '/about' },
        ]}
      />

      <Section tone="canvas">
        <Reveal className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          <RevealItem>
            <Stat value={source.data.altitudeMeters} label={t('stats.altitude')} suffix=" m" />
          </RevealItem>
          <RevealItem>
            <Stat value={5} label={t('stats.formats')} />
          </RevealItem>
          <RevealItem>
            <Stat value={24000} label={t('stats.capacity')} />
          </RevealItem>
          <RevealItem>
            <Stat value={4} label={t('stats.markets')} />
          </RevealItem>
        </Reveal>
      </Section>

      <Section tone="mist">
        <div className="grid gap-16">
          {blocks.map((block, index) => (
            <article
              key={block}
              id={block}
              className="grid gap-6 border-t border-line pt-10 lg:grid-cols-[18rem_1fr] lg:gap-16"
            >
              <div>
                <Eyebrow>{String(index + 1).padStart(2, '0')}</Eyebrow>
                <TextReveal
                  as="h2"
                  className="mt-4 font-display text-3xl leading-tight text-abyss-900"
                >
                  {t(`${block}.title`)}
                </TextReveal>
              </div>
              <Reveal>
                <p className="max-w-2xl text-lg leading-relaxed text-ink-muted">
                  {t(`${block}.body`)}
                </p>
              </Reveal>
            </article>
          ))}
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('about'), path: '/about' },
        ])}
      />
    </>
  );
}
