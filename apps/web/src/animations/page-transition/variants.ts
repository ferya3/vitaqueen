import type { Variants, Transition } from 'motion/react';

/**
 * Page transitions are deliberately short. A 900 ms curtain looks impressive
 * once and then costs the visitor a second on every single click.
 */
export const pageTransition: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -8, transition: { ...pageTransition, duration: 0.28 } },
};

export const overlayVariants: Variants = {
  initial: { clipPath: 'inset(0 0 100% 0)' },
  enter: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } },
  exit: { clipPath: 'inset(100% 0 0 0)', transition: { duration: 0.4, ease: [0.65, 0, 0.35, 1] } },
};

export const menuVariants: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.045 },
  },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

export const menuItemVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  enter: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};
