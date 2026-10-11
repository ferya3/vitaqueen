'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/ui/Logo';
import { ArrowIcon } from '@/components/ui/Icons';
import { scrollTo } from '@/animations/lenis';

/**
 * The end of the page: back into deep water, with the wordmark set as large as
 * the screen allows. It closes every page the way the hero opens it.
 */
export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const year = new Date().getFullYear();

  const explore = primaryNavigation.slice(0, 6);
  const company = primaryNavigation.slice(6);

  return (
    <footer className="abyss grain relative isolate mt-10 overflow-hidden rounded-t-[2rem] sm:rounded-t-[3rem]">
      <div aria-hidden className="caustics is-slow" />
      <div className="shell relative z-10 pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo label={siteConfig.name} className="text-white" />
            <p className="mt-5 text-sm leading-relaxed text-ink-300">{t('about')}</p>
            <div className="mt-6 space-y-1.5 text-base font-medium text-white">
              <a href={`mailto:${siteConfig.email}`} className="block transition-colors hover:text-aqua-300">
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                className="block transition-colors hover:text-aqua-300"
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

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-ink-300 sm:flex-row">
          <p>
            © {year} {siteConfig.legalName}. {t('rights')}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
          >
            {t('backToTop')}
            <ArrowIcon className="size-3.5 -rotate-90 rtl:rotate-90 rtl:scale-x-100" />
          </button>
        </div>
      </div>

      {/* The wordmark, cut off by the bottom edge like a horizon. Always Latin:
          it is the brand, not a translation. */}
      <p
        aria-hidden
        dir="ltr"
        className="relative z-10 -mb-[0.22em] select-none text-center font-[family-name:var(--font-latin)] text-[19vw] font-bold leading-none tracking-[-0.06em] text-transparent [background-clip:text] [-webkit-background-clip:text] bg-gradient-to-b from-aqua-200/40 to-aqua-400/5"
      >
        VITAQUEEN
      </p>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xs font-semibold uppercase tracking-[0.2em] text-aqua-300/70">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm text-ink-200">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-white">
        {label}
      </Link>
    </li>
  );
}
