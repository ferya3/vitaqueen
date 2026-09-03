'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { menuItemVariants, menuVariants } from '@/animations/page-transition/variants';
import { useScrollLock } from '@/hooks/useScrollLock';
import { CloseIcon, ArrowIcon } from '@/components/ui/Icons';
import { LocaleSwitcher } from './LocaleSwitcher';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('nav');
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="menu"
          variants={menuVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          // Opaque, not translucent: a blurred page behind a menu makes the
          // menu's own labels harder to read on a phone in daylight.
          className="fixed inset-0 z-100 overflow-y-auto bg-ground-100"
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
        >
          {/* The same aurora as the page, so the menu reads as the site rather
              than as a separate screen. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_28rem_at_80%_0%,var(--color-aqua-100),transparent_65%)]"
          />

          <div className="relative">
            <div className="shell flex h-18 items-center justify-between">
              <LocaleSwitcher label={t('language')} />
              <button
                type="button"
                onClick={onClose}
                className="glass inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium text-heading"
              >
                <CloseIcon />
                {t('close')}
              </button>
            </div>

            <nav className="shell pb-16 pt-2">
              <ul className="flex flex-col gap-2">
                {primaryNavigation.map((item) => (
                  <motion.li key={item.key} variants={menuItemVariants}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="glass group flex items-center justify-between rounded-lg px-5 py-4 font-display text-xl font-semibold text-heading transition-colors hover:text-aqua-700"
                    >
                      {t(item.key)}
                      <ArrowIcon className="size-4 text-aqua-500 opacity-60 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
