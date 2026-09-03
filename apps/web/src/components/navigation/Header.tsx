'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { Logo } from '@/components/ui/Logo';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
import { ChevronIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';
import { siteConfig } from '@/config/site';
import { LocaleSwitcher } from './LocaleSwitcher';
import { MobileMenu } from './MobileMenu';

/**
 * Reads the scroll position without an effect, and re-renders only when the
 * boolean actually flips rather than on every scroll event.
 */
function useScrolledPast(threshold: number) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true });
      return () => window.removeEventListener('scroll', onChange);
    },
    () => window.scrollY > threshold,
    () => false,
  );
}

/**
 * A floating glass bar rather than a full-width band.
 *
 * At the top of the page it is barely there; past the fold it contracts, gains
 * its frosted material and lifts off the page. Because the whole site is light,
 * the header keeps one colour scheme the whole way down — there is no
 * dark-hero / light-body switch to get wrong.
 */
export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Close the menu and any open dropdown when the route changes. Adjusting
  // state during render (rather than in an effect) avoids the extra commit
  // where the old menu is still on screen over the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setOpenKey(null);
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-90 pointer-events-none"
        onMouseLeave={() => setOpenKey(null)}
      >
        <div className="shell">
          <div
            className={cn(
              'pointer-events-auto relative mt-3 flex items-center justify-between gap-3 rounded-pill px-3 transition-all duration-(--duration-base) ease-(--ease-water) sm:mt-4 sm:gap-5 sm:px-4',
              scrolled ? 'glass-strong h-14 sm:h-16' : 'h-15 bg-transparent sm:h-18',
            )}
          >
            <Link
              href="/"
              className="rounded-pill px-2 text-heading transition-opacity hover:opacity-70"
            >
              <Logo label={siteConfig.name} />
              <span className="sr-only">{t('home')}</span>
            </Link>

            <nav aria-label="Primary" className="hidden xl:block">
              <ul className="flex items-center gap-0.5">
                {primaryNavigation.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li
                      key={item.key}
                      className="relative"
                      onMouseEnter={() => setOpenKey(item.children ? item.key : null)}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-3.5 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-aqua-500/12 text-aqua-700'
                            : 'text-ink-600 hover:bg-ink-900/5 hover:text-heading',
                        )}
                      >
                        {t(item.key)}
                        {item.children ? <ChevronIcon className="size-3.5 opacity-50" /> : null}
                      </Link>

                      {item.children && openKey === item.key ? (
                        <ul className="glass-strong absolute start-0 top-[calc(100%+0.5rem)] min-w-60 overflow-hidden rounded-lg p-1.5">
                          {item.children.map((child) => (
                            <li key={child.key}>
                              <Link
                                href={child.href}
                                className="block rounded-md px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-aqua-500/10 hover:text-aqua-800"
                              >
                                {t(child.key)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-1.5">
              <LocaleSwitcher label={t('language')} />
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium text-heading transition-colors xl:hidden',
                  scrolled ? 'bg-ink-900/6 hover:bg-ink-900/10' : 'glass',
                )}
                aria-haspopup="dialog"
              >
                <span className="flex flex-col gap-[3px]" aria-hidden>
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                </span>
                {t('menu')}
              </button>
            </div>

            <ScrollProgress />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
