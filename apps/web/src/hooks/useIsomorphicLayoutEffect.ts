'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` warns during SSR. Motion setup must still run before paint
 * on the client, so swap the implementation instead of dropping the effect.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
