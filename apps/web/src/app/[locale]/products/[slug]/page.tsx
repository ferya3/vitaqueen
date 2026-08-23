import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { BottleGlyph } from '@/components/products/BottleGlyph';
import { ProductGrid } from '@/components/products/ProductGrid';
import { MineralChart } from '@/components/source/MineralChart';
import { SeedNotice } from '@/components/ui/SeedNotice';
import { ButtonLink } from '@/components/ui/Button';
import { DownloadIcon } from '@/components/ui/Icons';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, productSchema } from '@/lib/schema';
import { getProduct, getProducts, getWaterAnalysis } from '@/services/content';
import { formatVolume } from '@/lib/format';
import { locales, type Locale } from '@/i18n/routing';
import { seedProducts } from '@/content/seed';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

/**
 * Pre-generates the known formats for every locale. Anything the CMS adds later
 * is rendered on demand and then cached, so a new product does not need a
 * deploy to become reachable.
 */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    seedProducts(locale).map((product) => ({ locale, slug: product.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  try {
    const { data: product } = await getProduct(locale, slug);
    return buildMetadata({
      locale,
      path: `/products/${slug}`,
      title: product.name,
      description: product.description,
      siteName: meta('siteName'),
    });
  } catch {
    return { title: meta('siteName') };
  }
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'products' });
  const detail = await getTranslations({ locale, namespace: 'products.detail' });
  const specLabels = await getTranslations({ locale, namespace: 'products.specs' });
  const nutrition = await getTranslations({ locale, namespace: 'products.nutrition' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  let product;
  try {
    product = await getProduct(locale, slug);
  } catch {
    notFound();
  }

  const [{ data: analysis, seeded: analysisSeeded }, { data: allProducts }] = await Promise.all([
    getWaterAnalysis(locale),
    getProducts(locale),
  ]);

  const related = allProducts.filter((item) => item.slug !== slug);

  const trail = [
    { name: nav('home'), path: '/' },
    { name: nav('products'), path: '/products' },
    { name: product.data.name, path: `/products/${slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow={formatVolume(product.data.volumeMl, locale)}
        title={product.data.name}
        lead={product.data.description}
        backdrop="depth"
        trail={trail}
      />

      <Section tone="canvas">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex items-center justify-center rounded-lg bg-mist-200 p-12">
            <div className="h-80">
              <BottleGlyph volumeMl={product.data.volumeMl} />
            </div>
          </div>

          <div>
            <Eyebrow>{detail('specifications')}</Eyebrow>
            <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {product.data.specs.map((spec) => (
                <div key={spec.labelKey} className="border-b border-line pb-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">
                    {specLabels(spec.labelKey)}
                  </dt>
                  <dd className="mt-1.5 text-lg text-abyss-900 tabular">{spec.value}</dd>
                </div>
              ))}
            </dl>

            {product.data.datasheetUrl ? (
              <ButtonLink
                href={product.data.datasheetUrl}
                variant="secondary"
                className="mt-8"
              >
                <DownloadIcon />
                {common('downloadDatasheet')}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Section>

      <Section tone="deep">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <Eyebrow tone="light">{detail('minerals')}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl text-white">{t('title')}</h2>
            <MineralChart minerals={analysis.minerals} tone="light" columns={1} className="mt-8" />
            {analysisSeeded ? (
              <SeedNotice
                message={common('sampleData')}
                className="mt-8 border-white/20 bg-white/5 text-mist-400"
              />
            ) : null}
          </div>

          <div>
            <Eyebrow tone="light">{detail('nutrition')}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl text-white">{nutrition('title')}</h2>
            <dl className="mt-8 grid gap-3">
              {product.data.nutrition.map((row) => (
                <div
                  key={row.labelKey}
                  className="flex items-baseline justify-between border-b border-white/10 pb-3"
                >
                  <dt className="text-mist-400">{nutrition(row.labelKey)}</dt>
                  <dd className="text-aqua-300 tabular">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <Eyebrow tone="light">{detail('packaging')}</Eyebrow>
              <p className="mt-4 text-mist-300">{product.data.packaging}</p>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="mist">
          <Eyebrow>{detail('related')}</Eyebrow>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </Section>
      ) : null}

      <JsonLd
        data={[
          productSchema(product.data, locale, analysis),
          breadcrumbSchema(locale, trail),
        ]}
      />
    </>
  );
}
