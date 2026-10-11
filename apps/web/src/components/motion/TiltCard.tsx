'use client';

import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * A card that tilts toward the cursor, built on Framer Motion springs.
 *
 * Off for touch and for reduced motion — on a phone there is no hover to
 * respond to, and a surface that moves on its own is exactly what the
 * reduced-motion setting asks us not to do.
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), spring);
  const glareX = useTransform(x, [0, 1], ['0%', '100%']);
  const glareY = useTransform(y, [0, 1], ['0%', '100%']);
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(18rem circle at ${gx} ${gy}, rgb(255 255 255 / 0.35), transparent 60%)`,
  );

  // The same element either way, so the server render and the first client
  // render agree; reduced motion simply never feeds the springs.
  return (
    <motion.div
      className={cn('relative [transform-style:preserve-3d]', className)}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(event) => {
        if (reduce || event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width);
        y.set((event.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 motion-reduce:hidden [@media(hover:hover)]:group-hover:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  );
}
