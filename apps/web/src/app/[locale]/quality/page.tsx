import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AnalysisTable } from '@/components/quality/AnalysisTable';
import { CertificationGrid } from '@/components/quality/CertificationGrid';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { TextReveal } from '@/components/motion/TextReveal';
import { Reveal } from '@/components/motion/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getCertificates, getWaterAnalysis } from '@/services/content';
import { formatDate } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quality' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/quality',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function QualityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'quality' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  const [{ data: analysis, seeded }, { data: certificates }] = await Promise.all([
    getWaterAnalysis(locale),
    getCertificates(locale),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="lab"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('quality'), path: '/quality' },
        ]}
      />

      <Section tone="canvas">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div id="control" className="glass scroll-mt-28 rounded-2xl p-6 sm:p-8">
            <Eyebrow>{nav('qualityControl')}</Eyebrow>
            <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
              {t('control.title')}
            </TextReveal>
            <Reveal>
              <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('control.body')}</p>
            </Reveal>
          </div>

          <div id="laboratory" className="glass scroll-mt-28 rounded-2xl p-6 sm:p-8">
            <Eyebrow>{nav('qualityLaboratory')}</Eyebrow>
            <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
              {t('laboratory.title')}
            </TextReveal>
            <Reveal>
              <p className="mt-3 leading-relaxed text-ink-500 sm:text-lg">{t('laboratory.body')}</p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tone="mist" id="water-analysis">
        <Eyebrow>{nav('qualityAnalysis')}</Eyebrow>
        <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
          {t('analysis.title')}
        </TextReveal>
        <p className="mt-4 max-w-2xl text-ink-500">{t('analysis.body')}</p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-ink-500">{t('table.parameter')}:</dt>
            <dd className="text-ink-900">{analysis.samplingPoint}</dd>
          </div>
          {analysis.sampledAt ? (
            <div className="flex gap-2">
              <dt className="text-ink-500">{t('certificateMeta.validUntil')}:</dt>
              <dd className="text-ink-900">{formatDate(analysis.sampledAt, locale)}</dd>
            </div>
          ) : null}
          {analysis.laboratory ? (
            <div className="flex gap-2">
              <dt className="text-ink-500">{t('certificateMeta.issuer')}:</dt>
              <dd className="text-ink-900">{analysis.laboratory}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6">
          <AnalysisTable analysis={analysis} locale={locale} />
        </div>

        {seeded ? <SeedNotice message={common('sampleData')} className="mt-6" /> : null}
      </Section>

      <Section tone="canvas" id="certifications">
        <Eyebrow>{nav('qualityCertifications')}</Eyebrow>
        <TextReveal as="h2" className="mt-4 text-2xl sm:text-3xl">
          {t('certifications.title')}
        </TextReveal>
        <p className="mt-4 max-w-2xl text-ink-500">{t('certifications.body')}</p>
        <div className="mt-10">
          <CertificationGrid certificates={certificates} locale={locale} />
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('quality'), path: '/quality' },
        ])}
      />
    </>
  );
}
