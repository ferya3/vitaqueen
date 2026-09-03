'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BottleGlyph } from './BottleGlyph';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { SectionHead } from '@/components/ui/Section';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/types/content';

/**
 * The range, as a grid.
 *
 * This used to be a pinned horizontal track that ate a full viewport height and
 * hijacked the scroll. Five bottles fit on one screen as cards; the scroll
 * hijack bought nothing and cost every visitor a screen of travel.
 */
export function ProductRail({ products }: { products: Product[] }) {
  const t = useTranslations('home.productsTeaser');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <section className="shell section-y scroll-mt-24" id="products">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead eyebrow={<Eyebrow>{t('eyebrow')}</Eyebrow>} title={t('title')} lede={t('body')} />
        <ButtonLink href="/products" variant="secondary" size="sm" className="hidden sm:inline-flex">
          {t('cta')}
          <ArrowIcon />
        </ButtonLink>
      </div>

      <Reveal
        className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5"
        stagger={0.06}
      >
        {products.map((product) => (
          <RevealItem key={product.slug}>
            <Link
              href={`/products/${product.slug}`}
              className="glass group flex h-full flex-col rounded-xl p-4 transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-water) hover:-translate-y-1.5 hover:shadow-float sm:p-5"
            >
              <div className="mb-4 h-24 self-center sm:h-32">
                <BottleGlyph volumeMl={product.volumeMl} />
              </div>
              <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-aqua-600">
                {formatVolume(product.volumeMl, locale)}
              </p>
              <h3 className="mt-1 text-base sm:text-lg">{product.name}</h3>
              {product.tagline ? (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">
                  {product.tagline}
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-ink-600 transition-colors group-hover:text-aqua-700">
                {common('viewProduct')}
                <ArrowIcon className="size-3.5" />
              </span>
            </Link>
          </RevealItem>
        ))}
      </Reveal>

      <ButtonLink href="/products" variant="secondary" size="md" className="mt-6 w-full sm:hidden">
        {t('cta')}
        <ArrowIcon />
      </ButtonLink>
    </section>
  );
}
