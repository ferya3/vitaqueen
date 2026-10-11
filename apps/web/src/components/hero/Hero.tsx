'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useHeroTimeline } from '@/animations/hero/useHeroTimeline';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { BottleArt } from '@/components/products/BottleArt';
import { DeepBackdrop } from '@/components/ui/DeepBackdrop';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

// The WebGL layer is the heaviest thing on the site: never in the first chunk,
// never on the server, and only on devices measured as able to afford it.
const BottleScene = dynamic(() => import('@/components/three/BottleScene'), { ssr: false });

type HeroProps = {
  /** Three short facts along the bottom edge. Real values, from the source profile. */
  highlights?: Array<{ label: string; value: string }>;
  className?: string;
};

/**
 * The opening screen: deep water, an oversized claim and the bottle.
 *
 * Full height and dark on purpose — the one place on the site where the page
 * is an image rather than a document. The headline is the largest type in the
 * system; the bottle floats in a pool of light with ripples under it, and on
 * capable devices a WebGL field of droplets drifts behind everything.
 *
 * Structure is fixed here; the entrance and the pointer parallax live in
 * `useHeroTimeline`, addressed through the `data-hero-*` attributes.
 */
export function Hero({ highlights, className }: HeroProps) {
  const t = useTranslations('home.hero');
  const common = useTranslations('common');
  const ref = useHeroTimeline<HTMLElement>();
  const tier = useDeviceTier();

  return (
    <section
      ref={ref}
      className={cn('abyss grain relative isolate flex min-h-[100svh] flex-col overflow-hidden', className)}
    >
      <DeepBackdrop />
      {tier === 'high' ? (
        <div aria-hidden className="absolute inset-0 opacity-70">
          <BottleScene bottle={false} className="h-full w-full" />
        </div>
      ) : null}

      <div className="shell relative z-10 grid flex-1 items-center gap-8 pb-10 pt-28 sm:pt-32 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:pb-14">
        <div className="max-w-3xl">
          <div data-hero-eyebrow>
            <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
          </div>

          <h1 className="mt-6 text-7xl font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:mt-8 [:lang(ar)_&]:leading-[1.2] [:lang(fa)_&]:leading-[1.2]">
            {/* One element per line: SplitText rebuilds the DOM inside each,
                so nested markup here would be destroyed on the client. */}
            <span data-hero-line className="block">
              {t('line1')}
            </span>
            <span data-hero-line className="block text-white/75">
              {t('line2')}
            </span>
            <span data-hero-line className="text-shimmer block pb-[0.08em]">
              {t('line3')}
            </span>
          </h1>

          <p data-hero-sub className="mt-7 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
            {t('subtitle')}
          </p>

          <div data-hero-actions className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/products" variant="bright" size="lg">
              {t('secondaryCta')}
              <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/source" variant="glass" size="lg">
              {t('primaryCta')}
            </ButtonLink>
          </div>
        </div>

        <div data-hero-media className="relative mx-auto flex h-[38svh] w-full max-w-md items-end justify-center sm:h-[54svh] lg:h-[74svh]">
          {/* The pool of light the bottle stands in */}
          <div aria-hidden className="absolute inset-x-6 top-1/4 bottom-0 rounded-full bg-aqua-400/25 blur-3xl" />
          <div aria-hidden className="absolute bottom-[2%] left-1/2 h-16 w-[15rem] -translate-x-1/2 sm:h-24 sm:w-[22rem]">
            <span className="ripple inset-0" />
            <span className="ripple inset-0" style={{ animationDelay: '2s' }} />
            <span className="ripple inset-0" style={{ animationDelay: '4s' }} />
          </div>
          <div data-hero-subject className="relative h-full">
            <div className="animate-float h-full">
              <BottleArt volumeMl={1000} tone="dark" className="drop-shadow-[0_40px_60px_rgb(2_11_17/0.6)]" />
            </div>
          </div>
        </div>
      </div>

      <div data-hero-cue className="shell relative z-10 pb-8 sm:pb-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-6">
          {highlights?.length ? (
            <dl className="grid grid-cols-3 gap-6 sm:gap-14">
              {highlights.map((fact) => (
                <div key={fact.label} className="min-w-0">
                  <dt className="truncate text-2xs uppercase tracking-[0.18em] text-aqua-200/70">{fact.label}</dt>
                  <dd className="mt-1.5 truncate font-display text-xl font-semibold tabular text-white sm:text-3xl">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-300 sm:flex">
            <span className="relative block h-10 w-px overflow-hidden bg-white/15">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_2.2s_var(--ease-swell)_infinite] bg-aqua-300" />
            </span>
            {common('scrollToExplore')}
          </p>
        </div>
      </div>
    </section>
  );
}
