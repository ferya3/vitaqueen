'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/ui/Logo';
import { ArrowIcon } from '@/components/ui/Icons';
import { scrollTo } from '@/animations/lenis';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const year = new Date().getFullYear();

  const explore = primaryNavigation.slice(0, 6);
  const company = primaryNavigation.slice(6);

  return (
    <footer className="bg-abyss-950 text-mist-300">
      <div className="shell grid gap-14 py-20 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo label={siteConfig.name} className="text-mist-50" />
          <p className="mt-5 text-sm leading-relaxed text-mist-400">{t('about')}</p>
          <div className="mt-6 text-sm">
            <a href={`mailto:${siteConfig.email}`} className="block py-2 transition-colors hover:text-white lg:py-0.5">
              {siteConfig.email}
            </a>
            <a href={`tel:${siteConfig.phone.replace(/\s/g, '')}`} className="block py-2 transition-colors hover:text-white lg:py-0.5" dir="ltr">
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

      <div className="border-t border-white/8">
        <div className="shell flex flex-col items-center justify-between gap-4 py-6 text-xs text-mist-500 sm:flex-row">
          <p>
            © {year} {siteConfig.legalName}. {t('rights')}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="inline-flex items-center gap-2 transition-colors hover:text-white"
          >
            {t('backToTop')}
            <ArrowIcon className="h-3.5 w-3.5 -rotate-90 rtl:rotate-90 rtl:scale-x-100" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-[0.24em] text-mist-500">{title}</h2>
      <ul className="mt-4 space-y-1 text-sm lg:mt-5 lg:space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="inline-block py-2 transition-colors hover:text-white lg:py-0">
        {label}
      </Link>
    </li>
  );
}
