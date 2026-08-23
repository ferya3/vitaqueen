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
          className="fixed inset-0 z-100 bg-abyss-950/98 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
        >
          <div className="shell flex h-20 items-center justify-between">
            <LocaleSwitcher tone="light" label={t('language')} />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-pill border border-white/15 px-4 py-2 text-sm text-mist-200 transition-colors hover:border-white/40 hover:text-white"
            >
              <CloseIcon />
              {t('close')}
            </button>
          </div>

          <nav className="shell h-[calc(100dvh-5rem)] overflow-y-auto pb-16">
            <ul className="flex flex-col">
              {primaryNavigation.map((item) => (
                <motion.li key={item.key} variants={menuItemVariants} className="border-b border-white/8">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center justify-between py-5 font-display text-3xl font-light text-mist-100 transition-colors hover:text-aqua-300"
                  >
                    {t(item.key)}
                    <ArrowIcon className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
