'use client';

import { useTranslations } from 'next-intl';
import { useHeroTimeline } from '@/animations/hero/useHeroTimeline';
import { MediaLayer } from '@/components/ui/MediaLayer';
import { BottleGlyph } from '@/components/products/BottleGlyph';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Icons';
import type { BackdropVariant } from '@/components/ui/WaterBackdrop';
import { cn } from '@/lib/cn';

type HeroProps = {
  backdrop?: BackdropVariant;
  /** Mount the 3D bottle. Reserved for the home page — one scene per session. */
  scene?: boolean;
  /** Three short facts under the headline. Real values, from the source profile. */
  highlights?: Array<{ label: string; value: string }>;
  className?: string;
};

/**
 * The opening block.
 *
 * Two columns on a wide screen — the claim on one side, the product on the
 * other — and one stacked column on a phone. It is deliberately *not* a
 * full-viewport band: a headline floating in an empty screen was the single
 * biggest complaint about the previous design.
 *
 * Structure is fixed here; the motion lives entirely in `useHeroTimeline`,
 * addressed through `data-hero-*` attributes.
 */
export function Hero({ backdrop = 'spring', scene = false, highlights, className }: HeroProps) {
  const t = useTranslations('home.hero');
  const ref = useHeroTimeline<HTMLElement>();

  return (
    <section ref={ref} className={cn('shell pb-6 pt-24 sm:pb-10 sm:pt-32', className)}>
      <div
        data-hero-inner
        className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
      >
        <div>
          <div data-hero-eyebrow>
            <Eyebrow>{t('eyebrow')}</Eyebrow>
          </div>

          <h1 className="mt-4 text-5xl leading-[1.08] sm:mt-5 sm:text-6xl sm:leading-[1.04]">
            <span data-hero-line className="block">
              {t('line1')}
            </span>
            {/* Each line is its own element: SplitText rebuilds the DOM inside
                it, so any nested markup here would be destroyed on the client.
                The accent is carried by the line's own colour. */}
            <span data-hero-line className="block">
              {t('line2')}
            </span>
            <span data-hero-line className="block text-aqua-500">
              {t('line3')}
            </span>
          </h1>

          <p
            data-hero-sub
            className="mt-5 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg"
          >
            {t('subtitle')}
          </p>

          <div data-hero-actions className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/source" variant="primary" size="lg">
              {t('primaryCta')}
              <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/products" variant="secondary" size="lg">
              {t('secondaryCta')}
            </ButtonLink>
          </div>

          {highlights?.length ? (
            <dl
              data-hero-cue
              className="glass mt-8 grid grid-cols-3 gap-3 rounded-xl px-5 py-4 sm:gap-5 sm:px-6"
            >
              {highlights.map((fact) => (
                <div key={fact.label} className="min-w-0">
                  <dt className="truncate text-2xs uppercase tracking-[0.14em] text-ink-400">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 truncate text-base font-bold tabular text-heading sm:text-lg">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* The product side. On a phone it is a short banner rather than a
            half-screen of decoration. */}
        <div
          data-hero-media
          className="glass relative order-first aspect-4/3 overflow-hidden rounded-2xl sm:aspect-16/10 lg:order-last lg:aspect-5/6"
        >
          <MediaLayer backdrop={backdrop} scene={scene} priority />

          {/* The still that stands in for the WebGL bottle. `tier-poster` is
              removed by CSS the moment the 3D scene is allowed to mount, so the
              card is never empty and never shows two bottles. */}
          <div
            data-hero-subject
            className="tier-poster absolute inset-0 flex items-center justify-center p-8 sm:p-10"
          >
            <BottleGlyph volumeMl={1000} className="h-full max-h-[24rem] w-auto drop-shadow-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
