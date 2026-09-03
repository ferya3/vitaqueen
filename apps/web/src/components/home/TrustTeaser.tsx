import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TextReveal } from '@/components/motion/TextReveal';
import type { Locale } from '@/i18n/routing';

const PILLARS = ['p01', 'p02', 'p03', 'p04'] as const;

/**
 * Quality and sustainability, side by side.
 *
 * These are the two sections that decide whether a distributor takes the brand
 * seriously, so they sit above the closing call to action rather than below it.
 */
export async function TrustTeaser({ locale }: { locale: Locale }) {
  const quality = await getTranslations({ locale, namespace: 'home.qualityTeaser' });
  const sustainability = await getTranslations({ locale, namespace: 'home.sustainabilityTeaser' });
  const pillars = await getTranslations({ locale, namespace: 'sustainability.pillars' });

  return (
    <section className="bg-canvas section-y">
      <div className="shell grid gap-20 lg:grid-cols-2">
        <div>
          <Eyebrow>{quality('eyebrow')}</Eyebrow>
          <TextReveal as="h2" className="mt-6 max-w-md font-display text-4xl leading-tight text-abyss-900">
            {quality('title')}
          </TextReveal>
          <p className="mt-5 max-w-md leading-relaxed text-ink-muted sm:mt-6 sm:text-lg">{quality('body')}</p>
          <ButtonLink href="/quality" variant="secondary" className="mt-8">
            {quality('cta')}
            <ArrowIcon />
          </ButtonLink>
        </div>

        <div>
          <Eyebrow>{sustainability('eyebrow')}</Eyebrow>
          <TextReveal as="h2" className="mt-6 max-w-md font-display text-4xl leading-tight text-abyss-900">
            {sustainability('title')}
          </TextReveal>

          <Reveal className="mt-8 grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-2" stagger={0.07}>
            {PILLARS.map((pillar) => (
              <RevealItem key={pillar} className="bg-canvas p-6">
                <p className="font-display text-2xl text-aqua-500 tabular">{pillars(`${pillar}.index`)}</p>
                <h3 className="mt-3 text-base font-medium text-abyss-900">{pillars(`${pillar}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{pillars(`${pillar}.body`)}</p>
              </RevealItem>
            ))}
          </Reveal>

          <ButtonLink href="/sustainability" variant="secondary" className="mt-8">
            {sustainability('cta')}
            <ArrowIcon />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
