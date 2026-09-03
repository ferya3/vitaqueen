'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/ui/Logo';
import { ArrowIcon } from '@/components/ui/Icons';
import { scrollTo } from '@/animations/lenis';

/**
 * A floating glass slab rather than a dark band across the bottom. It ends the
 * page without introducing a second colour scheme.
 */
export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const year = new Date().getFullYear();

  const explore = primaryNavigation.slice(0, 6);
  const company = primaryNavigation.slice(6);

  return (
    <footer className="shell pb-6 pt-4">
      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="grid gap-8 p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo label={siteConfig.name} className="text-heading" />
            <p className="mt-4 text-sm leading-relaxed text-ink-500">{t('about')}</p>
            <div className="mt-5 space-y-1 text-sm font-medium text-ink-700">
              <a
                href={`mailto:${siteConfig.email}`}
                className="block transition-colors hover:text-aqua-700"
              >
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                className="block transition-colors hover:text-aqua-700"
                dir="ltr"
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>

          <FooterColumn title={t('explore')}>
            {explore.map((item) => (
              <FooterLink key={item.key} href={item.href} label={nav(item.key)} />
            ))}
          </FooterColumn>

          <FooterColumn title={t('company')}>
            {company.map((item) => (
              <FooterLink key={item.key} href={item.href} label={nav(item.key)} />
            ))}
          </FooterColumn>

          <FooterColumn title={t('legal')}>
            <FooterLink href="/legal/privacy" label={t('privacy')} />
            <FooterLink href="/legal/terms" label={t('terms')} />
            <FooterLink href="/legal/cookies" label={t('cookies')} />
          </FooterColumn>
        </div>

        <div className="border-t border-hairline px-7 sm:px-10">
          <div className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-500 sm:flex-row">
            <p>
              © {year} {siteConfig.legalName}. {t('rights')}
            </p>
            <button
              type="button"
              onClick={() => scrollTo(0)}
              className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 transition-colors hover:bg-ink-900/5 hover:text-heading"
            >
              {t('backToTop')}
              <ArrowIcon className="size-3.5 -rotate-90 rtl:rotate-90 rtl:scale-x-100" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xs font-semibold uppercase tracking-[0.2em] text-ink-400">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-ink-600">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-aqua-700">
        {label}
      </Link>
    </li>
  );
}
