'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BottleGlyph } from './BottleGlyph';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { ArrowIcon } from '@/components/ui/Icons';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/types/content';

export function ProductGrid({ products }: { products: Product[] }) {
  const common = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <Reveal
      as="ul"
      className="grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-2 lg:grid-cols-3"
      stagger={0.06}
    >
      {products.map((product) => (
        <RevealItem key={product.slug} as="li" className="bg-canvas">
          <Link
            href={`/products/${product.slug}`}
            className="group flex h-full flex-col p-8 transition-colors duration-(--duration-base) hover:bg-white"
          >
            <div className="mb-8 flex h-48 items-end justify-center">
              <BottleGlyph volumeMl={product.volumeMl} className="transition-transform duration-(--duration-slow) ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2" />
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-aqua-700">
              {formatVolume(product.volumeMl, locale)}
            </p>
            <h2 className="mt-2 font-display text-2xl text-abyss-900">{product.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.description}</p>
            <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm text-abyss-900 transition-colors group-hover:text-aqua-700">
              {common('viewProduct')}
              <ArrowIcon />
            </span>
          </Link>
        </RevealItem>
      ))}
    </Reveal>
  );
}
