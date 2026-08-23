'use client';

import { createElement, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useScrollReveal, type RevealDirection } from '@/animations/scroll/useScrollReveal';

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  stagger?: number;
  /** When true, direct children marked `data-reveal-item` animate in sequence. */
  start?: string;
  id?: string;
};

/**
 * Declarative wrapper around `useScrollReveal`. Use this in page markup; use
 * the hook directly only when a component needs the element ref for something
 * else as well.
 */
export function Reveal({
  children,
  as = 'div',
  className,
  direction = 'up',
  delay = 0,
  stagger = 0.08,
  start,
  id,
}: RevealProps) {
  const ref = useScrollReveal<HTMLElement>({ direction, delay, stagger, start });

  return createElement(
    as,
    { ref, className: cn(className), 'data-reveal': direction, id },
    children,
  );
}

/** Marks a child as an individually staggered item inside a `<Reveal>`. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return createElement(
    as,
    { className: cn(className), 'data-reveal-item': '', 'data-reveal': 'up' },
    children,
  );
}
