import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { DataTable } from '@/components/ui/DataTable';
import { ContactForm } from '@/components/contact/ContactForm';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getDistributors } from '@/services/content';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'distributors' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/distributors',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function DistributorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'distributors' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const { data: distributors } = await getDistributors(locale);

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="line"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('distributors'), path: '/distributors' },
        ]}
      />

      <Section tone="canvas">
        <Eyebrow>{t('findTitle')}</Eyebrow>
        {distributors.length === 0 ? (
          <p className="mt-5 max-w-lg rounded-2xl border border-dashed border-aqua-500/35 bg-aqua-50/60 px-6 py-8 text-ink-500">
            {t('empty')}
          </p>
        ) : (
          <DataTable
            className="mt-8"
            columns={[
              { key: 'company', label: t('company') },
              { key: 'region', label: t('region') },
              { key: 'phone', label: t('phone') },
            ]}
            rows={distributors.map((distributor) => ({
              company: distributor.company,
              region: [distributor.city, distributor.region, distributor.country]
                .filter(Boolean)
                .join(' · '),
              phone: distributor.phone,
            }))}
          />
        )}
      </Section>

      <Section tone="mist">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="glass h-fit rounded-2xl p-6 sm:p-8">
            <Eyebrow>{t('applyTitle')}</Eyebrow>
            <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
              {t('applyTitle')}
            </TextReveal>
            <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('lead')}</p>
          </div>
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <ContactForm defaultTopic="sales" />
          </div>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('distributors'), path: '/distributors' },
        ])}
      />
    </>
  );
}
