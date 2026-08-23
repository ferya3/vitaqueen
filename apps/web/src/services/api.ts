import 'server-only';
import { serverConfig } from '@/config/server';

export type ApiOptions = {
  locale: string;
  /** ISR window in seconds. Content pages are cheap to re-render, so keep it short. */
  revalidate?: number;
  /** Cache tags for on-demand invalidation from the CMS webhook. */
  tags?: string[];
  signal?: AbortSignal;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Server-side fetch against the Laravel API.
 *
 * Runs only on the server (`server-only`), so the browser never learns the API
 * origin and no token can leak into a client bundle. Every caller passes a
 * locale; the backend answers with that translation.
 */
export async function apiFetch<T>(path: string, options: ApiOptions): Promise<T> {
  const { locale, revalidate = 300, tags = [], signal } = options;
  const url = `${serverConfig.apiUrl}${path}`;

  const controller = new AbortController();
  // A slow CMS must not hold a page render open indefinitely.
  const timeout = setTimeout(() => controller.abort(), 6000);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': locale,
        ...(serverConfig.apiToken ? { Authorization: `Bearer ${serverConfig.apiToken}` } : {}),
      },
      next: { revalidate, tags },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`GET ${path} failed`, response.status);
    }

    const payload = (await response.json()) as { data?: T } & T;
    // Laravel API resources wrap collections in `data`; single values may not be.
    return (payload?.data ?? payload) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Runs `loader`, and falls back to locally seeded content if the API is not
 * reachable.
 *
 * This is deliberate, not laziness: the marketing site must build and deploy
 * even when the CMS is down or has not been provisioned yet. The fallback is
 * logged so a silent, permanently-stale production is impossible to miss.
 */
export async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: () => T,
  label: string,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (serverConfig.requireApi) throw error;
    console.warn(
      `[api] ${label} unavailable, serving seeded content:`,
      error instanceof Error ? error.message : error,
    );
    return fallback();
  }
}
