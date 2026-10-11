'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useLocale, useTranslations } from 'next-intl';
import { gsap } from '@/animations/gsap';
import { Link } from '@/i18n/navigation';
import { BottleArt } from './BottleArt';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/types/content';

/** One tint per card, from shallow to deep, so the row reads as a gradient. */
const TINTS = [
  'from-[#e9fbff] to-[#c7f1fb]',
  'from-[#dcf7ff] to-[#a9e7f6]',
  'from-[#c9f1fb] to-[#84d9ef]',
  'from-[#a5e8f7] to-[#4cc4e2]',
  'from-[#74d3ec] to-[#1597bd]',
];

/**
 * The range as a horizontal, pinned track.
 *
 * On a wide screen with a precise pointer the section pins and vertical scroll
 * drives the row sideways (GSAP ScrollTrigger, scrubbed). Everywhere else —
 * phones, tablets, reduced motion — it is a native swipeable row with scroll
 * snapping, which is what those devices are good at anyway. RTL runs the
 * track the other way.
 */
export function ProductShowcase({ products }: { products: Product[] }) {
  const t = useTranslations('home.productsTeaser');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const pane = viewport.current;
        const row = track.current;
        if (!pane || !row) return;

        const rtl = document.documentElement.dir === 'rtl';
        const distance = () => Math.max(0, row.scrollWidth - pane.clientWidth);
        if (distance() < 40) return;

        // The native scroller hands over to the pin.
        pane.style.overflow = 'visible';
        gsap.to(row, {
          x: () => (rtl ? distance() : -distance()),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        return () => {
          pane.style.overflow = '';
        };
      });
      return () => mm.revert();
    },
    { scope: section, dependencies: [products.length] },
  );

  return (
    <section ref={section} id="products" className="relative scroll-mt-24 overflow-hidden py-(--spacing-section) lg:flex lg:min-h-svh lg:flex-col lg:justify-center">
      <div className="shell flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 className="mt-5 text-5xl font-semibold tracking-[-0.035em] [:lang(ar)_&]:leading-[1.3] [:lang(fa)_&]:leading-[1.3]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">{t('body')}</p>
        </div>
        <ButtonLink href="/products" variant="outline" size="md">
          {t('cta')}
          <ArrowIcon />
        </ButtonLink>
      </div>

      <div
        ref={viewport}
        className="mt-10 overflow-x-auto overscroll-x-contain [scrollbar-width:none] snap-x snap-mandatory sm:mt-14 [&::-webkit-scrollbar]:hidden"
      >
        <ul ref={track} className="flex w-max gap-4 px-(--spacing-gutter) sm:gap-6 lg:ps-[max(var(--spacing-gutter),calc((100vw-var(--container-shell))/2+var(--spacing-gutter)))]">
          {products.map((product, index) => (
            <li key={product.slug} className="snap-start">
              <Link
                href={`/products/${product.slug}`}
                className={cn(
                  'group relative flex h-[30rem] w-[78vw] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br p-7 sm:h-[34rem] sm:w-[24rem] sm:p-8',
                  TINTS[index % TINTS.length],
                )}
              >
                {/* The volume, oversized and outlined, as the card's image */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -end-4 -top-6 font-display text-[10rem] font-bold leading-none tracking-tighter text-white/60 text-outline sm:text-[12rem]"
                >
                  {product.volumeMl >= 1000 ? formatNumber(product.volumeMl / 1000, locale) : formatNumber(product.volumeMl, locale)}
                </span>

                <div className="relative flex flex-1 items-end justify-center">
                  <div
                    className="transition-transform duration-(--duration-slow) ease-(--ease-water) group-hover:-translate-y-3 group-hover:rotate-[-3deg]"
                    style={{ height: `${Math.min(100, 58 + Math.cbrt(product.volumeMl / 330) * 16)}%` }}
                  >
                    <BottleArt volumeMl={product.volumeMl} tone="light" idSuffix="show" />
                  </div>
                </div>

                <div className="relative mt-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-abyss-700/70">
                      {product.tagline}
                    </p>
                    <h3 className="mt-1.5 text-2xl font-semibold text-abyss-900">{product.name}</h3>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-abyss-900 text-white transition-transform duration-(--duration-base) group-hover:scale-110">
                    <ArrowIcon className="size-5" />
                    <span className="sr-only">{common('viewProduct')}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
          <li aria-hidden className="w-px shrink-0 lg:w-[max(var(--spacing-gutter),calc((100vw-var(--container-shell))/2))]" />
        </ul>
      </div>
    </section>
  );
}
