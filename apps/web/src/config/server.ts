import 'server-only';

/**
 * Server-only configuration.
 *
 * Deliberately not `NEXT_PUBLIC_*`: the API origin is an internal address that
 * the browser never calls — every request to Laravel is made server-side — and
 * inlining it into the client bundle would publish part of the private network
 * layout to every visitor for no benefit.
 */
export const serverConfig = {
  apiUrl: process.env.API_URL ?? 'http://localhost:8000/api/v1',
  apiToken: process.env.API_TOKEN,
  /** Fail loudly instead of falling back to seeded content. */
  requireApi: process.env.REQUIRE_API === 'true',
} as const;
