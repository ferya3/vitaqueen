'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { GlobeIcon, ChevronIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

const labels: Record<Locale, string> = {
  fa: 'فارسی',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
};

export function LocaleSwitcher({ label }: { label: string }) {
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    setOpen(false);
    startTransition(() => {
      // `usePathname` from `@/i18n/navigation` returns the pathname without its
      // locale prefix but with dynamic segments resolved, so the visitor stays
      // on the same product or article after switching language.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={label}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-900/5 hover:text-heading',
          pending && 'opacity-60',
        )}
      >
        <GlobeIcon />
        <span>{labels[active]}</span>
        <ChevronIcon className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <ul className="glass-strong absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-40 overflow-hidden rounded-lg p-1.5">
          {locales.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                lang={locale}
                dir={locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr'}
                onClick={() => switchTo(locale)}
                className={cn(
                  'block w-full rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-aqua-500/10',
                  locale === active ? 'font-semibold text-aqua-700' : 'text-ink-600',
                )}
              >
                {labels[locale]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
