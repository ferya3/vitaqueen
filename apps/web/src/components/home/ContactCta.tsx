import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { WaterBackdrop } from '@/components/ui/WaterBackdrop';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';

/**
 * The closing ask. One panel, both routes out — a general enquiry and the
 * export desk — plus the two contact details people actually copy.
 */
export async function ContactCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.cta' });

  return (
    <section className="shell section-y scroll-mt-24" id="contact">
      <div className="relative overflow-hidden rounded-2xl border border-white/70 shadow-glass">
        <WaterBackdrop variant="spring" />

        <div className="relative z-10 grid gap-7 p-7 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="max-w-lg text-4xl sm:text-5xl">{t('title')}</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
              {t('body')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="lg">
                {t('primary')}
                <ArrowIcon />
              </ButtonLink>
              <ButtonLink href="/export" variant="light" size="lg">
                {t('secondary')}
              </ButtonLink>
            </div>
          </div>

          <dl className="glass grid gap-4 rounded-xl p-5 sm:p-6">
            <div>
              <dt className="text-2xs uppercase tracking-[0.16em] text-ink-400">{t('primary')}</dt>
              <dd className="mt-1 text-base font-bold text-heading sm:text-lg">
                <a href={`mailto:${siteConfig.email}`} className="hover:text-aqua-700">
                  {siteConfig.email}
                </a>
              </dd>
            </div>
            <div className="border-t border-hairline pt-4">
              <dt className="text-2xs uppercase tracking-[0.16em] text-ink-400">{t('secondary')}</dt>
              <dd className="mt-1 text-base font-bold text-heading sm:text-lg">
                <a href={`mailto:${siteConfig.exportEmail}`} className="hover:text-aqua-700">
                  {siteConfig.exportEmail}
                </a>
              </dd>
            </div>
            <div className="border-t border-hairline pt-4">
              <dt className="text-2xs uppercase tracking-[0.16em] text-ink-400">
                {siteConfig.legalName}
              </dt>
              <dd dir="ltr" className="mt-1 text-base font-bold tabular text-heading sm:text-lg">
                <a href={`tel:${siteConfig.phone.replace(/\s/g, '')}`} className="hover:text-aqua-700">
                  {siteConfig.phone}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
