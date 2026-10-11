import { getTranslations } from 'next-intl/server';
import { Droplets, Leaf, Recycle, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { Spotlight } from '@/components/motion/Spotlight';
import type { Locale } from '@/i18n/routing';

const PILLARS: Array<{ key: 'p01' | 'p02' | 'p03' | 'p04'; icon: LucideIcon }> = [
  { key: 'p01', icon: ShieldCheck },
  { key: 'p02', icon: Zap },
  { key: 'p03', icon: Recycle },
  { key: 'p04', icon: Leaf },
];

/**
 * Quality and sustainability as a bento grid: one large tile that makes the
 * claim and links to the evidence, four tiles for the commitments behind it.
 * Each tile lights up under the cursor.
 */
export async function QualityBento({ locale }: { locale: Locale }) {
  const quality = await getTranslations({ locale, namespace: 'home.qualityTeaser' });
  const sustainability = await getTranslations({ locale, namespace: 'home.sustainabilityTeaser' });
  const pillars = await getTranslations({ locale, namespace: 'sustainability.pillars' });
  const bento = await getTranslations({ locale, namespace: 'home.bento' });

  return (
    <section id="quality" className="shell section-y scroll-mt-24">
      <Reveal className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" stagger={0.07}>
        <RevealItem className="md:col-span-2 lg:row-span-2">
          <Spotlight className="relative flex h-full min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-aqua-400 via-aqua-500 to-aqua-700 p-8 text-white sm:p-10">
            <Droplets aria-hidden className="pointer-events-none absolute -bottom-10 -end-10 size-72 text-white/10" strokeWidth={1} />
            <div>
              <Eyebrow tone="light" className="bg-white/15 text-white">{quality('eyebrow')}</Eyebrow>
              <h2 className="mt-6 max-w-md text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-white [:lang(ar)_&]:leading-[1.3] [:lang(fa)_&]:leading-[1.3]">
                {quality('title')}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">{quality('body')}</p>
            </div>
            <div className="relative mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/quality" variant="light" size="lg">
                {bento('cta')}
                <ArrowIcon />
              </ButtonLink>
              <ButtonLink href="/sustainability" variant="glass" size="lg">
                {sustainability('cta')}
              </ButtonLink>
            </div>
          </Spotlight>
        </RevealItem>

        {PILLARS.map(({ key, icon: Icon }) => (
          <RevealItem key={key}>
            <Spotlight className="flex h-full flex-col rounded-[2rem] border border-hairline bg-white p-7 shadow-glass transition-transform duration-(--duration-base) hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-aqua-500/10 text-aqua-600">
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <span className="font-display text-sm font-semibold tabular text-ink-300">{pillars(`${key}.index`)}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{pillars(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{pillars(`${key}.body`)}</p>
            </Spotlight>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
