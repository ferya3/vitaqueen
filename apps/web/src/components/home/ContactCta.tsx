import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';

/**
 * The closing ask, set as a poster: the invitation at display size, one big
 * round link that does the obvious thing, and the two addresses people copy.
 */
export async function ContactCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.cta' });

  return (
    <section id="contact" className="shell section-y scroll-mt-24">
      <div className="grid gap-10 border-t border-hairline pt-14 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="display display-xl max-w-3xl">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500">{t('body')}</p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-base font-semibold text-heading sm:text-lg">
            <a href={`mailto:${siteConfig.email}`} className="border-b-2 border-aqua-400 pb-1 transition-colors hover:text-aqua-700">
              {siteConfig.email}
            </a>
            <a href={`mailto:${siteConfig.exportEmail}`} className="border-b-2 border-aqua-400 pb-1 transition-colors hover:text-aqua-700">
              {siteConfig.exportEmail}
            </a>
          </div>
          <ButtonLink href="/export" variant="outline" size="lg" className="mt-8">
            {t('secondary')}
          </ButtonLink>
        </div>

        <Link
          href="/contact"
          className="group relative grid size-44 place-items-center justify-self-start overflow-hidden rounded-full bg-abyss-900 text-white transition-transform duration-(--duration-slow) ease-(--ease-water) hover:scale-105 sm:size-56 lg:justify-self-end"
        >
          <span aria-hidden className="absolute inset-0 scale-0 rounded-full bg-aqua-500 transition-transform duration-(--duration-slow) ease-(--ease-water) group-hover:scale-100" />
          <span className="relative flex flex-col items-center gap-2 text-center text-base font-semibold">
            <ArrowIcon className="size-8 -rotate-45 rtl:rotate-45" />
            {t('primary')}
          </span>
        </Link>
      </div>
    </section>
  );
}
