import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { getArticle } from '@/services/content';
import { formatDate } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  try {
    const { data: article } = await getArticle(locale, slug);
    return buildMetadata({
      locale,
      path: `/news/${slug}`,
      title: article.title,
      description: article.excerpt,
      siteName: meta('siteName'),
      type: 'article',
      publishedTime: article.publishedAt,
      image: article.cover ?? undefined,
    });
  } catch {
    return { title: meta('siteName') };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'news' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  let article;
  try {
    article = (await getArticle(locale, slug)).data;
  } catch {
    notFound();
  }

  const trail = [
    { name: nav('home'), path: '/' },
    { name: nav('news'), path: '/news' },
    { name: article.title, path: `/news/${slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow={`${t('published')} · ${formatDate(article.publishedAt, locale)}`}
        title={article.title}
        lead={article.excerpt}
        backdrop="depth"
        trail={trail}
      />

      <Section tone="canvas">
        {/* Body HTML is sanitised server-side in Laravel before it is stored;
            see `App\Services\HtmlSanitizer`. Never render CMS HTML that has not
            been through it. */}
        <article
          className="prose-vitaqueen max-w-2xl"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </Section>

      <JsonLd data={[articleSchema(article, locale), breadcrumbSchema(locale, trail)]} />
    </>
  );
}
