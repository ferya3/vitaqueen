'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryNavigation } from '@/config/navigation';
import { menuItemVariants, menuVariants } from '@/animations/page-transition/variants';
import { useScrollLock } from '@/hooks/useScrollLock';
import { CloseIcon, ArrowIcon } from '@/components/ui/Icons';
import { useMenuStore } from '@/stores/ui';
import { LocaleSwitcher } from './LocaleSwitcher';

export function MobileMenu() {
  const t = useTranslations('nav');
  const open = useMenuStore((state) => state.menuOpen);
  const onClose = useMenuStore((state) => state.closeMenu);
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
          // Opaque deep water, not a translucent sheet: a blurred page behind a
          // menu makes the menu's own labels harder to read in daylight.
          className="abyss fixed inset-0 z-100 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
        >
          <div aria-hidden className="caustics" />

          <div className="relative">
            <div className="shell flex h-18 items-center justify-between">
              <LocaleSwitcher label={t('language')} tone="light" />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
              >
                <CloseIcon />
                {t('close')}
              </button>
            </div>

            <nav className="shell pb-16 pt-2">
              <ul className="flex flex-col">
                {primaryNavigation.map((item, index) => (
                  <motion.li key={item.key} variants={menuItemVariants} className="border-b border-white/10">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-center gap-4 py-4 font-display text-3xl font-semibold text-white transition-colors hover:text-aqua-200"
                    >
                      <span className="w-8 font-sans text-xs font-medium tabular text-aqua-300/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1">{t(item.key)}</span>
                      <ArrowIcon className="size-5 text-aqua-300 opacity-0 transition-opacity group-hover:opacity-100" />
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
