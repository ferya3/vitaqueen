import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import { ArrowIcon } from '@/components/ui/Icons';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { getNews } from '@/services/content';
import { formatDate } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/news',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'news' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const { data: articles } = await getNews(locale);

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="depth"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('news'), path: '/news' },
        ]}
      />

      <Section tone="canvas">
        {articles.length === 0 ? (
          <p className="max-w-lg rounded-2xl border border-dashed border-aqua-500/35 bg-aqua-50/60 px-6 py-8 text-ink-500">
            {t('empty')}
          </p>
        ) : (
          <Reveal as="ul" className="grid gap-4" stagger={0.06}>
            {articles.map((article) => (
              <RevealItem as="li" key={article.slug}>
                <Link
                  href={`/news/${article.slug}`}
                  className="glass group grid gap-3 rounded-2xl p-6 transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-water) hover:-translate-y-1 hover:shadow-float sm:p-8 lg:grid-cols-[10rem_1fr] lg:gap-8"
                >
                  <time
                    dateTime={article.publishedAt}
                    className="text-sm text-ink-500 tabular"
                  >
                    {formatDate(article.publishedAt, locale)}
                  </time>
                  <div>
                    <h2 className="text-xl transition-colors group-hover:text-aqua-700 sm:text-2xl">
                      {article.title}
                    </h2>
                    <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">{article.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-aqua-700">
                      {t('readMore')}
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        )}
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('news'), path: '/news' },
        ])}
      />
    </>
  );
}
