'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { Logo } from '@/components/ui/Logo';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
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
 * The header sits over the hero in its transparent state and turns into a solid
 * bar once the visitor has scrolled past it.
 *
 * The whole site map lives behind one menu button on the leading edge — the
 * right in Persian — with the logo centred and a single contact link on the
 * far side. Ten top-level sections, several of them two words long in four
 * scripts, never fitted beside a centred logo; the overlay in `MobileMenu` is
 * now the navigation at every width rather than a small-screen substitute for
 * it.
 */
export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useState(false);

  const contactHref =
    primaryNavigation.find((item) => item.key === 'contact')?.href ?? '/contact';
  const contactActive = pathname === contactHref;

  // Close the menu when the route changes. Adjusting state during render
  // (rather than in an effect) avoids the extra commit where the old menu is
  // still on screen over the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-90 transition-[background-color,backdrop-filter,border-color] duration-(--duration-base)',
          scrolled
            ? 'border-b border-white/10 bg-abyss-950/85 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        {/* Three tracks, not a flex row: the outer two are equal, so the logo
            in the middle sits on the centre of the page rather than on
            whatever is left over between the controls beside it. */}
        <div className="shell grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center justify-self-start">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-white/15 px-4 py-2 text-sm text-mist-200 transition-colors hover:border-white/40 hover:text-white"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <span className="flex flex-col gap-1" aria-hidden>
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
              </span>
              {t('menu')}
            </button>
          </div>

          <Link
            href="/"
            className="justify-self-center text-mist-50 transition-opacity hover:opacity-80"
          >
            <Logo label={siteConfig.name} />
            <span className="sr-only">{t('home')}</span>
          </Link>

          <div className="flex items-center gap-2 justify-self-end">
            <LocaleSwitcher tone="light" label={t('language')} />
            <Link
              href={contactHref}
              className={cn(
                'hidden min-h-11 items-center rounded-pill px-4 py-2 text-sm transition-colors sm:inline-flex',
                contactActive ? 'text-aqua-300' : 'text-mist-200 hover:text-white',
              )}
            >
              {t('contact')}
            </Link>
          </div>
        </div>

        <ScrollProgress />
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
