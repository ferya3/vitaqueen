import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ContactForm } from '@/components/contact/ContactForm';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

const BLOCKS = ['markets', 'privateLabel', 'packaging'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'export' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/export',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function ExportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'export' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="depth"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('export'), path: '/export' },
        ]}
      />

      <Section tone="canvas">
        <Reveal className="grid gap-12 lg:grid-cols-3" stagger={0.08}>
          {BLOCKS.map((block, index) => (
            <RevealItem key={block}>
              <Eyebrow>{String(index + 1).padStart(2, '0')}</Eyebrow>
              <h2 className="mt-4 font-display text-2xl text-abyss-900">{t(`${block}.title`)}</h2>
              <p className="mt-4 leading-relaxed text-ink-muted">{t(`${block}.body`)}</p>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section tone="mist" id="international-contact">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <TextReveal as="h2" className="mt-5 font-display text-3xl text-abyss-900">
              {t('contact.title')}
            </TextReveal>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">{t('contact.body')}</p>
          </div>
          {/* The export enquiry is the same pipeline as the contact form, just
              pre-filed under the right topic so it reaches the right desk. */}
          <ContactForm defaultTopic="export" />
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('export'), path: '/export' },
        ])}
      />
    </>
  );
}
