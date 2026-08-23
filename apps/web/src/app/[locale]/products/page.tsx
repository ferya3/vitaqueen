import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { DataTable } from '@/components/ui/DataTable';
import { ProductGrid } from '@/components/products/ProductGrid';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { TextReveal } from '@/components/motion/TextReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getProducts } from '@/services/content';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/products',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'products' });
  const specs = await getTranslations({ locale, namespace: 'products.specs' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  const { data: products, seeded } = await getProducts(locale);

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="depth"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('products'), path: '/products' },
        ]}
      />

      <Section tone="canvas" id="categories">
        <ProductGrid products={products} />
      </Section>

      <Section tone="mist" id="specifications">
        <Eyebrow>{t('specifications')}</Eyebrow>
        <TextReveal as="h2" className="mt-5 font-display text-3xl text-abyss-900">
          {t('specifications')}
        </TextReveal>

        {/* One comparison table beats five separate spec sheets for a buyer
            deciding which formats to list. */}
        <DataTable
          className="mt-10"
          columns={[
            { key: 'product', label: t('categories') },
            { key: 'volume', label: specs('volume'), numeric: true },
            { key: 'bottleType', label: specs('bottleType') },
            { key: 'capType', label: specs('capType') },
            { key: 'unitsPerCase', label: specs('unitsPerCase'), numeric: true },
            { key: 'casesPerPallet', label: specs('casesPerPallet'), numeric: true },
            { key: 'shelfLife', label: specs('shelfLife'), numeric: true },
          ]}
          rows={products.map((product) => ({
            product: product.name,
            volume: formatVolume(product.volumeMl, locale),
            bottleType: product.bottleType,
            capType: product.capType,
            unitsPerCase: product.unitsPerCase,
            casesPerPallet: product.casesPerPallet,
            shelfLife: product.shelfLifeMonths,
          }))}
        />

        {seeded ? <SeedNotice message={common('sampleData')} className="mt-8" /> : null}
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('products'), path: '/products' },
        ])}
      />
    </>
  );
}
