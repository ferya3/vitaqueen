'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useHorizontalScroll } from '@/animations/scroll/useHorizontalScroll';
import { BottleGlyph } from './BottleGlyph';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Icons';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/types/content';

/**
 * The product range as a scroll-driven horizontal track on desktop and a native
 * swipe carousel below `lg` — the hook bails out on narrow viewports rather
 * than pinning a section a thumb cannot escape.
 */
export function ProductRail({ products }: { products: Product[] }) {
  const t = useTranslations('home.productsTeaser');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const { sectionRef, trackRef } = useHorizontalScroll<HTMLElement, HTMLUListElement>();

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-mist-200 py-14 sm:py-24 lg:h-screen lg:py-0"
      id="products"
    >
      <div className="shell lg:flex lg:h-full lg:flex-col lg:justify-center">
        <div className="max-w-xl">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 className="mt-5 font-display text-4xl leading-tight text-abyss-900 sm:mt-6">{t('title')}</h2>
          <p className="mt-4 text-ink-muted sm:mt-5 sm:text-lg">{t('body')}</p>
        </div>

        <div className="-mx-(--spacing-gutter) mt-8 overflow-x-auto px-(--spacing-gutter) pb-4 sm:mt-12 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
          <ul
            ref={trackRef}
            className="flex w-max gap-6 lg:gap-8"
          >
            {products.map((product) => (
              <li key={product.slug} className="w-[13.5rem] shrink-0 sm:w-[19rem]">
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-abyss-900/8 bg-white/70 p-5 transition-[transform,box-shadow] duration-(--duration-base) ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-lift sm:p-7"
                >
                  <div className="mb-5 h-28 self-center sm:mb-6 sm:h-40">
                    <BottleGlyph volumeMl={product.volumeMl} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.22em] text-aqua-700">
                    {formatVolume(product.volumeMl, locale)}
                  </p>
                  <h3 className="mt-2 font-display text-lg text-abyss-900 sm:text-xl">{product.name}</h3>
                  {product.tagline ? (
                    <p className="mt-2 text-sm text-ink-muted">{product.tagline}</p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm text-abyss-900 transition-colors group-hover:text-aqua-700">
                    {common('viewProduct')}
                    <ArrowIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
