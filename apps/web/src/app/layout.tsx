import type { ReactNode } from 'react';

/**
 * Pass-through root layout.
 *
 * `<html>` needs `lang` and `dir`, and both depend on the `[locale]` segment,
 * so the real document shell lives in `app/[locale]/layout.tsx`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
