'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/animations/page-transition/variants';

/**
 * Set after the first page has mounted. The first render is the server's HTML
 * and must appear at once — fading in the LCP element costs real seconds and
 * hides the page from anyone without JavaScript — so only client-side
 * navigations after that animate.
 */
let hasNavigated = false;

/**
 * Fades page bodies in across route changes, with Framer Motion.
 *
 * Wraps the page inside the locale layout and is keyed by the path, so each
 * navigation mounts a fresh wrapper. (Not a `template.tsx`: Next loads that
 * file's chunk without the CSP nonce, and `strict-dynamic` then refuses it.)
 * Opacity only: a transform here would become the containing block for GSAP's
 * pinned sections and break them.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const animateIn = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <motion.div key={pathname} variants={pageVariants} initial={animateIn ? 'initial' : false} animate="enter">
      {children}
    </motion.div>
  );
}
