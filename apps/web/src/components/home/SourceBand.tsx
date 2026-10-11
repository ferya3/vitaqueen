import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { DeepBackdrop } from '@/components/ui/DeepBackdrop';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { Stat } from '@/components/ui/Stat';
import { MineralChart } from '@/components/source/MineralChart';
import type { Locale } from '@/i18n/routing';
import type { SourceProfile } from '@/types/content';

/**
 * The source, as numbers, on deep water.
 *
 * Four measured facts at display size that count up as they arrive, then the
 * mineral signature as bars. The dark band breaks the light page in the middle
 * and gives the scroll a rhythm: light, deep, light.
 */
export async function SourceBand({
  locale,
  profile,
  seeded = false,
}: {
  locale: Locale;
  profile: SourceProfile;
  seeded?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'home.sourceTeaser' });
  const numbers = await getTranslations({ locale, namespace: 'home.numbers' });
  const facts = await getTranslations({ locale, namespace: 'source.facts' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const stats = [
    { value: profile.altitudeMeters, suffix: 'm', label: facts('altitude'), decimals: 0 },
    { value: profile.ph, label: facts('ph'), decimals: 1 },
    { value: profile.tds, suffix: 'mg/L', label: facts('tds'), decimals: 0 },
    { value: profile.temperatureC, suffix: '°C', label: facts('temperature'), decimals: 1 },
  ];

  return (
    <section id="source" className="shell scroll-mt-24 py-6 sm:py-10">
      <div className="abyss grain relative isolate overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
        <DeepBackdrop />
        <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow tone="light">{numbers('eyebrow')}</Eyebrow>
              <h2 className="display display-md mt-5 text-white">
                {numbers('title')}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-200">{t('body')}</p>
            </div>
            <ButtonLink href="/source" variant="glass">
              {t('cta')}
              <ArrowIcon />
            </ButtonLink>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/10 pt-10 lg:grid-cols-4 [&>*]:min-w-0 [&>*]:border-white/10 lg:[&>*:not(:first-child)]:border-s lg:[&>*:not(:first-child)]:ps-8">
            {stats.map((stat) => (
              <Stat key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} decimals={stat.decimals} tone="light" size="xl" />
            ))}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h3 className="text-2xl font-semibold text-white">{t('title')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">
                {facts('type')}: <span className="text-white">{profile.sourceType}</span>
                <br />
                {facts('age')}: <span className="text-white">{profile.aquiferAge}</span>
              </p>
              {seeded ? <SeedNotice message={common('sampleData')} className="mt-6 border-white/15 bg-white/5 text-ink-200" /> : null}
            </div>
            <MineralChart minerals={profile.minerals.slice(0, 6)} tone="light" />
          </div>
        </div>
      </div>
    </section>
  );
}
