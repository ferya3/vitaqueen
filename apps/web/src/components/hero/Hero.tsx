'use client';

import { useTranslations } from 'next-intl';
import { useHeroTimeline } from '@/animations/hero/useHeroTimeline';
import { MediaLayer } from '@/components/ui/MediaLayer';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Icons';
import { scrollTo } from '@/animations/lenis';
import type { BackdropVariant } from '@/components/ui/WaterBackdrop';
import { cn } from '@/lib/cn';

type HeroProps = {
  namespace?: string;
  backdrop?: BackdropVariant;
  /** Mount the 3D bottle. Reserved for the home page — one scene per session. */
  scene?: boolean;
  className?: string;
};

/**
 * The full-screen opening. Structure is fixed; the motion lives entirely in
 * `useHeroTimeline`, addressed through `data-hero-*` attributes.
 */
export function Hero({ backdrop = 'spring', scene = false, className }: HeroProps) {
  const t = useTranslations('home.hero');
  const common = useTranslations('common');
  const ref = useHeroTimeline<HTMLElement>();

  return (
    <section
      ref={ref}
      className={cn(
        // Bottom-aligned is the desktop composition: the 3D bottle fills the
        // space above it. That scene is never mounted on a phone, so the same
        // alignment leaves a third of the screen empty above the headline.
        'relative flex min-h-[100svh] items-center overflow-hidden bg-abyss-950 text-mist-50 sm:items-end',
        className,
      )}
    >
      <div data-hero-media className="absolute inset-0 scale-105">
        <MediaLayer backdrop={backdrop} scene={scene} priority />
      </div>

      {/* Legibility scrim: the headline must survive whatever art sits behind it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-abyss-950 via-abyss-950/45 to-abyss-950/70"
      />

      <div data-hero-inner className="shell relative z-10 w-full pb-10 pt-24 sm:pb-24 sm:pt-32">
        <div className="grid items-end gap-7 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div data-hero-eyebrow>
              <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
            </div>

            <h1 className="mt-5 font-display text-hero leading-[0.95] tracking-tight sm:mt-7 sm:leading-[0.92]">
              <span data-hero-line className="block overflow-hidden">
                {t('line1')}
              </span>
              <span data-hero-line className="block overflow-hidden text-aqua-300">
                {t('line2')}
              </span>
              <span data-hero-line className="block overflow-hidden">
                {t('line3')}
              </span>
            </h1>
          </div>

          <div className="max-w-md lg:pb-4">
            <p data-hero-sub className="leading-relaxed text-mist-300 sm:text-lg">
              {t('subtitle')}
            </p>

            <div data-hero-actions className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <ButtonLink href="/source" variant="light" size="md" className="sm:h-14 sm:px-8 sm:text-base">
                {t('primaryCta')}
                <ArrowIcon />
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="ghost"
                size="md"
                className="text-mist-200 hover:text-white sm:h-14 sm:px-8 sm:text-base"
              >
                {t('secondaryCta')}
              </ButtonLink>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-hero-cue
          onClick={() => scrollTo('#journey', { offset: -80 })}
          className="group mt-10 hidden items-center gap-3 text-xs uppercase tracking-[0.28em] text-mist-400 transition-colors hover:text-white sm:mt-16 sm:inline-flex"
        >
          <span className="relative flex h-10 w-6 items-start justify-center rounded-pill border border-current/40 p-1.5">
            <span className="h-1.5 w-1 animate-bounce rounded-pill bg-current motion-reduce:animate-none" />
          </span>
          {common('scrollToExplore')}
        </button>
      </div>
    </section>
  );
}
