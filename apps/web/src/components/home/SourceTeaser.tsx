import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { SectionHead } from '@/components/ui/Section';
import { MineralChart } from '@/components/source/MineralChart';
import { SourceMap } from '@/components/source/SourceMap';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { SourceProfile } from '@/types/content';

/**
 * The source, in one screen: the claim, six measured facts, the catchment
 * diagram and the mineral signature. Everything here is a number someone can
 * be held to — which is why nothing on this page is a decorative superlative.
 */
export async function SourceTeaser({
  locale,
  profile,
  seeded = false,
}: {
  locale: Locale;
  profile: SourceProfile;
  /** True when the figures are the local sample set rather than CMS data. */
  seeded?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'home.sourceTeaser' });
  const facts = await getTranslations({ locale, namespace: 'source.facts' });
  const common = await getTranslations({ locale, namespace: 'common' });

  return (
    <section className="shell section-y scroll-mt-24" id="source">
      <div className="glass-strong overflow-hidden rounded-2xl p-6 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col">
            <SectionHead
              eyebrow={<Eyebrow>{t('eyebrow')}</Eyebrow>}
              title={t('title')}
              lede={t('body')}
            />

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Fact label={facts('altitude')} value={`${formatNumber(profile.altitudeMeters, locale)} m`} />
              <Fact label={facts('ph')} value={formatNumber(profile.ph, locale)} />
              <Fact label={facts('tds')} value={`${formatNumber(profile.tds, locale)} mg/L`} />
              <Fact label={facts('temperature')} value={`${formatNumber(profile.temperatureC, locale)} °C`} />
              <Fact label={facts('hardness')} value={`${formatNumber(profile.hardness, locale)} mg/L`} />
              <Fact label={facts('type')} value={profile.sourceType} />
            </dl>

            <div className="mt-6">
              <ButtonLink href="/source" variant="primary">
                {t('cta')}
                <ArrowIcon />
              </ButtonLink>
            </div>

            {seeded ? <SeedNotice message={common('sampleData')} className="mt-5" /> : null}
          </div>

          <div className="grid gap-6">
            <SourceMap
              altitude={`${formatNumber(profile.altitudeMeters, locale)} m`}
              className="aspect-16/10"
            />
            <MineralChart minerals={profile.minerals.slice(0, 5)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-2xs uppercase tracking-[0.14em] text-ink-400">{label}</dt>
      <dd className="mt-0.5 truncate text-lg font-bold tabular text-heading">{value}</dd>
    </div>
  );
}
