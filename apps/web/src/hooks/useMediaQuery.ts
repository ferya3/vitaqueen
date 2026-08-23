'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query.
 *
 * `useSyncExternalStore` rather than `useEffect` + `setState`: the browser owns
 * this value, React is only reading it, and this way there is no extra render
 * pass on mount and no server/client mismatch.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

export const useIsCoarsePointer = () => useMediaQuery('(pointer: coarse)');
