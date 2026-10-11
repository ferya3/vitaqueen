'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BottleArt } from './BottleArt';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      stagger={0.06}
    >
      {products.map((product) => (
        <RevealItem key={product.slug} as="li">
          <TiltCard className="group h-full rounded-2xl">
            <Link
              href={`/products/${product.slug}`}
              className="glass group flex h-full flex-col rounded-2xl p-6 transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-water) hover:-translate-y-1.5 hover:shadow-float sm:p-7"
            >
              <div className="mb-5 flex h-32 items-end justify-center sm:h-40">
                {product.images[0] ? (
                  // Uploads are already resized WebP; the optimiser adds nothing.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].src}
                    alt={product.images[0].alt}
                    width={product.images[0].width}
                    height={product.images[0].height}
                    loading="lazy"
                    className="h-full w-auto object-contain transition-transform duration-(--duration-slow) ease-(--ease-water) group-hover:-translate-y-2"
                  />
                ) : (
                  <BottleArt volumeMl={product.volumeMl} tone="light" idSuffix="grid" className="transition-transform duration-(--duration-slow) ease-(--ease-water) group-hover:-translate-y-2" />
                )}
              </div>
              <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-aqua-600">
                {formatVolume(product.volumeMl, locale)}
              </p>
              <h2 className="mt-1 text-lg sm:text-xl">{product.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{product.description}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-ink-600 transition-colors group-hover:text-aqua-700">
                {common('viewProduct')}
                <ArrowIcon className="size-3.5" />
              </span>
            </Link>
          </TiltCard>
        </RevealItem>
      ))}
    </Reveal>
  );
}
