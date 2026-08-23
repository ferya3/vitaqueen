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

export function LocaleSwitcher({
  tone = 'light',
  label,
}: {
  tone?: 'light' | 'dark';
  label: string;
}) {
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
          'inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm transition-colors',
          tone === 'light'
            ? 'text-mist-200 hover:text-white'
            : 'text-abyss-700 hover:text-abyss-900',
          pending && 'opacity-60',
        )}
      >
        <GlobeIcon />
        <span className="hidden sm:inline">{labels[active]}</span>
        <ChevronIcon className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <ul
          className={cn(
            'absolute end-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-md border py-1 shadow-lift',
            tone === 'light'
              ? 'border-white/10 bg-abyss-900/95 backdrop-blur'
              : 'border-line bg-white',
          )}
        >
          {locales.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                lang={locale}
                dir={locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr'}
                onClick={() => switchTo(locale)}
                className={cn(
                  'block w-full px-4 py-2 text-start text-sm transition-colors',
                  tone === 'light'
                    ? 'text-mist-200 hover:bg-white/10'
                    : 'text-abyss-800 hover:bg-mist-100',
                  locale === active && 'text-aqua-400',
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
