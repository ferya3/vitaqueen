import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/vazirmatn';
import '../globals.css';

/**
 * The admin panel's own document. It sits outside `[locale]` because the panel
 * is Persian-only, and the public layout's header, footer, smooth scrolling
 * and 3D have no place in a CMS.
 */
export const metadata: Metadata = {
  title: { default: 'پنل مدیریت ویتاکوئین', template: '%s · پنل مدیریت ویتاکوئین' },
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#f2fafd',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa-IR"
      dir="rtl"
      style={{ '--font-brand-display': 'var(--font-arabic)', '--font-brand-sans': 'var(--font-arabic)' } as React.CSSProperties}
    >
      <body className="min-h-dvh bg-ground-100 text-body antialiased">{children}</body>
    </html>
  );
}
