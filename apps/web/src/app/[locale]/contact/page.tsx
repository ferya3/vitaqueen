import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ContactForm } from '@/components/contact/ContactForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path: '/contact',
    title: t('title'),
    description: t('lead'),
    siteName: meta('siteName'),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'contact' });
  const office = await getTranslations({ locale, namespace: 'contact.office' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        backdrop="depth"
        trail={[
          { name: nav('home'), path: '/' },
          { name: nav('contact'), path: '/contact' },
        ]}
      />

      <Section tone="canvas">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div className="glass h-fit rounded-2xl p-6 sm:p-8">
            <Eyebrow>{office('title')}</Eyebrow>
            <dl className="mt-6 grid gap-5 text-sm">
              <div>
                <dt className="text-ink-500">{office('email')}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${siteConfig.email}`} className="text-ink-900 transition-colors hover:text-aqua-700">
                    {siteConfig.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">{office('phone')}</dt>
                <dd className="mt-1" dir="ltr">
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                    className="text-ink-900 transition-colors hover:text-aqua-700"
                  >
                    {siteConfig.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">{nav('export')}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${siteConfig.exportEmail}`} className="text-ink-900 transition-colors hover:text-aqua-700">
                    {siteConfig.exportEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: nav('home'), path: '/' },
          { name: nav('contact'), path: '/contact' },
        ])}
      />
    </>
  );
}
