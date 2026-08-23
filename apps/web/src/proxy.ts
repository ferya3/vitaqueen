import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Parses `Accept-Language` and returns the best supported locale.
 * Kept deliberately small — a full BCP-47 matcher is not worth a dependency
 * for four locales.
 */
function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.toLowerCase(), quality: q ? Number(q.split('=')[1]) || 0 : 1 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    const match = locales.find((locale) => locale === tag || locale === base);
    if (match) return match;
  }

  return defaultLocale;
}

/**
 * Whether the browser reached the site over TLS.
 *
 * This is not the same question as "is this a production build", and getting
 * the two confused is expensive: `upgrade-insecure-requests` on an origin that
 * only answers on `http://` makes the browser rewrite every stylesheet, script
 * and font URL to `https://`, the connection is refused, and the page renders
 * as bare HTML. The document itself still arrives, so the site looks like it
 * lost its CSS rather than like a protocol problem.
 *
 * `X-Forwarded-Proto` is what nginx and Cloudflare both send. The request's own
 * scheme covers a direct hit on the Node server. `ASSUME_HTTPS=true` is the
 * escape hatch for a proxy that terminates TLS without forwarding the header.
 */
function isSecureRequest(request: NextRequest) {
  if (process.env.ASSUME_HTTPS === 'true') return true;

  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0].trim().toLowerCase() === 'https';

  return request.nextUrl.protocol === 'https:';
}

function buildContentSecurityPolicy(nonce: string, isDev: boolean, isSecure: boolean) {
  return [
    `default-src 'self'`,
    // `strict-dynamic` lets the Next bootstrap load its own chunks while
    // still refusing any script the nonce did not authorise.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''}`,
    // Next and Motion both set style attributes at runtime; there is no
    // nonce-based alternative for those.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `media-src 'self' blob:`,
    // Fonts are self-hosted by `next/font`, so no third-party font origin.
    `font-src 'self'`,
    // The API is only ever called server-side, so the browser needs no
    // third-party connect target at all.
    `connect-src 'self' ${isDev ? 'ws: http://localhost:*' : ''}`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `manifest-src 'self'`,
    // Only ever on an origin that actually answers over TLS. On a plain-HTTP
    // deployment this directive breaks every subresource on the page.
    ...(isSecure ? ['upgrade-insecure-requests'] : []),
  ]
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SECURITY_HEADERS: Array<[string, string]> = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  [
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()',
  ],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Cross-Origin-Resource-Policy', 'same-origin'],
  ['X-DNS-Prefetch-Control', 'off'],
];

/**
 * Locale routing and security headers in one pass.
 *
 * This is Next 16's `proxy` convention (formerly `middleware`).
 *
 * Locale negotiation is implemented here rather than delegated so that the
 * request headers can be rewritten before they reach the app — which is the
 * only way Next.js can pick up the CSP nonce for its own inline bootstrap
 * script. Cloudflare and nginx add their layers in front of this; see
 * `docs/security.md`.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';
  const isSecure = isSecureRequest(request);

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildContentSecurityPolicy(nonce, isDev, isSecure);

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : negotiateLocale(request.headers.get('accept-language'));

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;

    const redirect = NextResponse.redirect(url);
    applyHeaders(redirect, csp, isSecure);
    return redirect;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applyHeaders(response, csp, isSecure);

  // Remember the visitor's choice so the bare domain resolves to it next time.
  const current = pathname.split('/')[1] as Locale;
  if (request.cookies.get(LOCALE_COOKIE)?.value !== current) {
    response.cookies.set(LOCALE_COOKIE, current, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
      // Same reasoning as the CSP above: a `Secure` cookie set over plain HTTP
      // is discarded by the browser, and the visitor's locale never sticks.
      secure: isSecure,
      httpOnly: false,
    });
  }

  return response;
}

function applyHeaders(response: NextResponse, csp: string, isSecure: boolean) {
  response.headers.set('Content-Security-Policy', csp);
  for (const [key, value] of SECURITY_HEADERS) response.headers.set(key, value);

  // Duplicating the edge's HSTS means a direct hit on the origin is protected
  // too — but only over TLS. A browser discards the header on a plain-HTTP
  // response anyway, and it belongs here rather than in `next.config.ts`
  // because only a per-request check can know the scheme.
  if (isSecure) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
}

export const config = {
  // Everything except Next internals and files that already live on disk.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
