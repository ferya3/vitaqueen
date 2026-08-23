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
        'relative flex min-h-[100svh] items-end overflow-hidden bg-abyss-950 text-mist-50',
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

      <div data-hero-inner className="shell relative z-10 w-full pb-16 pt-32 sm:pb-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div data-hero-eyebrow>
              <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
            </div>

            <h1 className="mt-7 font-display text-hero leading-(--leading-display) tracking-tight">
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
            <p data-hero-sub className="text-lg leading-relaxed text-mist-300">
              {t('subtitle')}
            </p>

            <div data-hero-actions className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/source" variant="light" size="lg">
                {t('primaryCta')}
                <ArrowIcon />
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="ghost"
                size="lg"
                className="text-mist-200 hover:text-white"
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
          className="group mt-16 inline-flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-mist-400 transition-colors hover:text-white"
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
