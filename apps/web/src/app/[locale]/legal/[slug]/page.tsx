import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { apiFetch } from '@/services/api';
import { buildMetadata } from '@/lib/seo';
import { locales, type Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

const LEGAL_SLUGS = ['privacy', 'terms', 'cookies'] as const;
type LegalSlug = (typeof LEGAL_SLUGS)[number];

type CmsPage = { title: string; body: string; updatedAt?: string };

export function generateStaticParams() {
  return locales.flatMap((locale) => LEGAL_SLUGS.map((slug) => ({ locale, slug })));
}

/**
 * Legal copy is CMS-owned. There is no seeded fallback: a privacy policy that
 * an AI or a developer invented is worse than an honest "not published yet",
 * because visitors and regulators both read it as a binding statement.
 */
async function loadPage(locale: Locale, slug: string): Promise<CmsPage | null> {
  try {
    return await apiFetch<CmsPage>(`/pages/${slug}`, { locale, tags: ['pages', `page:${slug}`] });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const footer = await getTranslations({ locale, namespace: 'footer' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return { title: meta('siteName') };

  const page = await loadPage(locale, slug);
  const title = page?.title ?? footer(slug as LegalSlug);

  return buildMetadata({
    locale,
    path: `/legal/${slug}`,
    title,
    description: title,
    siteName: meta('siteName'),
    // Nothing is gained by indexing an unpublished policy.
    noindex: !page,
  });
}

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) notFound();

  setRequestLocale(locale);

  const footer = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const page = await loadPage(locale, slug);
  const title = page?.title ?? footer(slug as LegalSlug);

  return (
    <>
      <PageHero
        eyebrow={footer('legal')}
        title={title}
        backdrop="depth"
        trail={[
          { name: nav('home'), path: '/' },
          { name: title, path: `/legal/${slug}` },
        ]}
      />

      <Section tone="canvas">
        {page ? (
          <article
            className="prose-vitaqueen max-w-2xl"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        ) : (
          <p className="max-w-lg rounded-lg border border-dashed border-hairline px-6 py-8 text-ink-500">
            {common('error')}
          </p>
        )}
      </Section>
    </>
  );
}
