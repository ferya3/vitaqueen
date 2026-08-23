import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { MineralChart } from '@/components/source/MineralChart';
import { SourceMap } from '@/components/source/SourceMap';
import { TextReveal } from '@/components/motion/TextReveal';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { SourceProfile } from '@/types/content';

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
    <section className="relative overflow-hidden bg-abyss-950 text-mist-100 section-y" id="source">
      <div className="shell grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
          <TextReveal as="h2" className="mt-6 font-display text-4xl leading-tight text-white">
            {t('title')}
          </TextReveal>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mist-400">{t('body')}</p>

          <dl className="mt-10 grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
            <Fact label={facts('altitude')} value={`${formatNumber(profile.altitudeMeters, locale)} m`} />
            <Fact label={facts('ph')} value={formatNumber(profile.ph, locale)} />
            <Fact label={facts('tds')} value={`${formatNumber(profile.tds, locale)} mg/L`} />
            <Fact label={facts('temperature')} value={`${formatNumber(profile.temperatureC, locale)} °C`} />
            <Fact label={facts('hardness')} value={`${formatNumber(profile.hardness, locale)} mg/L`} />
            <Fact label={facts('type')} value={profile.sourceType} />
          </dl>

          <ButtonLink href="/source" variant="light" className="mt-10">
            {t('cta')}
            <ArrowIcon />
          </ButtonLink>
        </div>

        <div className="grid gap-10">
          <SourceMap
            altitude={`${formatNumber(profile.altitudeMeters, locale)} m`}
            className="aspect-16/10"
          />
          <MineralChart minerals={profile.minerals.slice(0, 6)} tone="light" />
          {seeded ? (
            <SeedNotice
              message={common('sampleData')}
              className="border-white/20 bg-white/5 text-mist-400"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-mist-500">{label}</dt>
      <dd className="mt-1.5 font-display text-xl text-aqua-300 tabular">{value}</dd>
    </div>
  );
}
