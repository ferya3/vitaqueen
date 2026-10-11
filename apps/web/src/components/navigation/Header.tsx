'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { Logo } from '@/components/ui/Logo';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
import { ChevronIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';
import { useMenuStore } from '@/stores/ui';
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
 * A floating bar that changes material with the page under it.
 *
 * Every page opens on a dark, immersive hero, so at the top the header is
 * transparent with white type. Past the first 24 px it contracts into a light
 * frosted pill with dark type and lifts off the content.
 */
export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const openMenu = useMenuStore((state) => state.openMenu);
  const closeMenu = useMenuStore((state) => state.closeMenu);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Close any open dropdown when the route changes. Adjusting local state
  // during render (rather than in an effect) avoids the extra commit where the
  // old dropdown is still on screen over the new page.
  // The menu lives in a shared store, which must not be written during render.
  useEffect(() => closeMenu(), [pathname, closeMenu]);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenKey(null);
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-90 pointer-events-none"
        onMouseLeave={() => setOpenKey(null)}
      >
        <div className="mx-auto w-full max-w-[88rem] px-(--spacing-gutter) xl:px-6">
          <div
            className={cn(
              'pointer-events-auto relative mt-3 flex items-center justify-between gap-3 rounded-pill px-3 transition-all duration-(--duration-base) ease-(--ease-water) sm:mt-4 sm:gap-5 sm:px-4',
              scrolled ? 'glass-strong h-14 text-heading sm:h-16' : 'h-15 bg-transparent text-white sm:h-18',
            )}
          >
            <Link
              href="/"
              className="rounded-pill px-2 transition-opacity hover:opacity-70"
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
                          'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? scrolled
                              ? 'bg-aqua-500/12 text-aqua-700'
                              : 'bg-white/12 text-white'
                            : scrolled
                              ? 'text-ink-600 hover:bg-ink-900/5 hover:text-heading'
                              : 'text-white/75 hover:bg-white/10 hover:text-white',
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
              <LocaleSwitcher label={t('language')} tone={scrolled ? 'default' : 'light'} />
              <button
                type="button"
                onClick={openMenu}
                className={cn(
                  'inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors xl:hidden',
                  scrolled
                    ? 'bg-ink-900/6 text-heading hover:bg-ink-900/10'
                    : 'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/15',
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

            {scrolled ? <ScrollProgress /> : null}
          </div>
        </div>
      </header>

      <MobileMenu />
    </>
  );
}
