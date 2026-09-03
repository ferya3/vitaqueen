import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { SectionHead } from '@/components/ui/Section';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import type { Locale } from '@/i18n/routing';

const PILLARS = ['p01', 'p02', 'p03', 'p04'] as const;

/**
 * Quality and sustainability in one band.
 *
 * These are the two things a distributor actually evaluates, so they sit
 * together above the contact block rather than as two separate scroll stops.
 */
export async function QualityTeaser({ locale }: { locale: Locale }) {
  const quality = await getTranslations({ locale, namespace: 'home.qualityTeaser' });
  const sustainability = await getTranslations({ locale, namespace: 'home.sustainabilityTeaser' });
  const pillars = await getTranslations({ locale, namespace: 'sustainability.pillars' });

  return (
    <section className="shell section-y scroll-mt-24" id="quality">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-28">
          <SectionHead
            eyebrow={<Eyebrow>{quality('eyebrow')}</Eyebrow>}
            title={quality('title')}
            lede={quality('body')}
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/quality" variant="primary">
              {quality('cta')}
              <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/sustainability" variant="secondary">
              {sustainability('cta')}
            </ButtonLink>
          </div>
        </div>

        <Reveal className="grid gap-3 sm:grid-cols-2 sm:gap-4" stagger={0.07}>
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar} className="glass rounded-xl p-5 sm:p-6">
              <p className="font-display text-2xl font-extrabold tabular text-aqua-500/80">
                {pillars(`${pillar}.index`)}
              </p>
              <h3 className="mt-2 text-base">{pillars(`${pillar}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {pillars(`${pillar}.body`)}
              </p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
