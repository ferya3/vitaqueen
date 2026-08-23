# Architecture

## The shape of the thing

```
                          INTERNET
                             │
                        CLOUDFLARE
                    DNS · WAF · DDoS · Bot · Cache · Turnstile
                             │
                           NGINX                    (origin, Cloudflare IPs only)
              ┌──────────────┴──────────────┐
              │                             │
        vitaqueen.com                 api.vitaqueen.com
              │                             │
          NEXT.JS 16                    LARAVEL 13
      SSR · ISR · proxy.ts              PHP 8.4 · FPM
              │                             │
              │   server-to-server     ┌────┼────┬─────────┐
              └───────────────────────▶│    │    │         │
                                     MYSQL REDIS  STORAGE (private disk)
```

The browser talks to Next.js and nothing else. Every call to Laravel is made
server-side, which is why the API origin is not a `NEXT_PUBLIC_` variable and
why `connect-src` in the CSP is just `'self'`.

## Five layers

The project is organised as the five layers the brief called for, and each one
has a real home in the tree rather than being an idea in a document.

| Layer | Where it lives |
| --- | --- |
| **1 · Brand** | `apps/web/src/app/globals.css` (`@theme`), `config/site.ts`, `components/ui/Logo.tsx` |
| **2 · Experience** | `apps/web/src/animations/**`, `components/motion/**`, `components/three/**` |
| **3 · Content** | `apps/api/app/Models/**`, `apps/web/src/services/content.ts`, `src/content/seed.ts` |
| **4 · Technology** | `apps/web`, `apps/api`, `infra/docker` |
| **5 · Security** | `apps/web/src/proxy.ts`, `apps/api/app/Http/Middleware/**`, `app/Policies/**`, `infra/nginx` |

## Front end

### Routing and locale

`src/proxy.ts` (Next 16's replacement for `middleware.ts`) does two jobs in one
pass: it negotiates the locale and it builds the CSP.

Locale negotiation is hand-written rather than delegated to `next-intl`'s
middleware, and that is a deliberate trade. Owning the response means the
request headers can be rewritten before they reach the app, which is the only
way Next.js can pick up a per-request CSP nonce for its own inline bootstrap
script. Handing that off would have meant `script-src 'unsafe-inline'`.

`next-intl` still does everything else — message catalogues, `getTranslations`,
locale-aware `Link` and `useRouter`.

### Rendering

Pages render on demand rather than statically, because reading the nonce header
opts the segment into dynamic rendering. The trade is deliberate:

- **Cost:** no pre-rendered HTML at build time.
- **Benefit:** a strict CSP with no `unsafe-inline`, and content that is never
  stale by a deploy.
- **Mitigation:** data fetches are cached by tag with a 5-minute revalidate, the
  API sets `s-maxage=300, stale-while-revalidate=600`, and Cloudflare caches the
  HTML at the edge. The origin does far less work than "dynamic" suggests.

### Content services and the seed fallback

Every page reads through `src/services/content.ts`, which returns
`{ data, seeded }`. If the API is unreachable, the loader falls back to
`src/content/seed.ts` and `seeded` is `true`.

This is not a convenience hack. It has two rules:

1. **The site must build and deploy before the CMS exists.** A marketing site
   that cannot render until someone has provisioned MySQL is a site that misses
   its launch date.
2. **Sample data must never look authoritative.** Wherever seeded figures reach
   the screen — mineral values, the analysis table — the page renders a
   `SeedNotice` in the visitor's language. Certificates have no fallback at all.

Set `REQUIRE_API=true` in production once the CMS is live and the fallback
becomes a hard failure instead, so a broken API is loud rather than silent.

### Directory layout

```
src/
├── app/[locale]/          route tree, one directory per page
├── animations/            GSAP timelines and scroll hooks, no JSX
│   ├── hero/  scroll/  micro-interactions/  page-transition/
│   ├── gsap.ts            single plugin registration point
│   ├── lenis.ts           smooth-scroll singleton
│   └── splitting.ts       script-aware text splitting
├── components/
│   ├── motion/            declarative wrappers over the animation hooks
│   ├── ui/                primitives (Button, Section, DataTable, …)
│   ├── three/             the one WebGL scene, lazy and client-only
│   └── hero/ home/ source/ products/ factory/ quality/ contact/ navigation/
├── config/                site constants, navigation tree, server-only config
├── content/               seeded fallback content
├── hooks/                 browser-state hooks (media query, device tier, pointer)
├── i18n/                  routing, request config, locale-aware navigation
├── lib/                   cn, formatting, SEO, schema.org
├── services/              API client and content loaders (server-only)
└── types/                 the contract with the API
```

Animation code contains no JSX and components contain no GSAP. A component asks
for `<Reveal>` or `useHeroTimeline()`; it never writes a timeline inline. That
is what stops the project turning into three hundred lines of `gsap.to` per
page.

## Back end

### Request path

```
Route  →  FormRequest (validate)  →  Policy (authorise)  →  Service  →  Model
                                                              │
                                                          Resource (shape)
```

Controllers do not contain business logic and do not contain authorisation
logic. `ProductController` is the reference: eight lines per action.

### Translations

Translatable columns are JSON: `{"fa": "…", "en": "…"}`, read through the
`HasTranslations` trait.

The alternative — a `*_translations` table per model — doubles the query count
on every list endpoint and buys flexibility this project does not need: the
locale set is fixed at four and no locale has extra fields. A missing
translation falls back to the fallback locale, then to any populated value, so a
half-translated record renders instead of showing a blank page.

### Caching

There is no application-level cache of Eloquent models, on purpose. Public reads
are cached at the HTTP layer by `PublicCacheHeaders`, which Cloudflare and the
Next.js data cache both honour. That cache is shared across processes, expires
on a clock rather than on someone remembering to call `Cache::forget()` in the
right place, and cannot break on a deploy the way a serialised model can.

Redis still backs sessions, queues and the framework cache.

### Audit log

`Auditable` writes a row for every create, update and delete. Two properties
make it worth having:

- It records the **diff**, not the whole row, so a reviewer can see what changed
  without reading two JSON blobs.
- Secrets are excluded by name — password hashes and 2FA secrets must not be
  recoverable from a table that more people can read than `users`.

There is no update or delete endpoint for it. Retention is enforced by
`vitaqueen:prune`, scheduled daily.

## What is deliberately not here

Being explicit about the gaps is more useful than implying they do not exist.

| Not built | Why, and what to do |
| --- | --- |
| **Admin UI** | The admin *API* is complete and tested; the panel that consumes it is a separate front end. Build it against `docs/api.md`, or drive it with an admin toolkit — nothing in the API assumes a particular client. |
| **Certificates** | No seed, no fallback. Enter only documents the factory holds. A certificate invented to fill a grid is a compliance problem with a delay fuse. |
| **Real analysis figures** | The seeded analysis is unpublished and labelled as sample data everywhere it surfaces. |
| **Photography and video** | `WaterBackdrop` generates the art; `MediaLayer` swaps in real assets as soon as they exist. Stock photography of a generic mountain would be worse than no photograph. |
| **Cloudflare configuration** | WAF rules, Turnstile keys, bot rules and cache rules are account settings, not repository files. `docs/security.md` lists what to enable. |
| **Monitoring** | Sentry, uptime and log shipping are wired for by config (`SENTRY_LARAVEL_DSN`) but not provisioned here. |
| **CI deploy step** | The workflow builds and tests. The deploy target is infrastructure-specific; the runner should be outside the production host. |

## Decisions worth remembering

- **Next.js + Laravel over Blade.** The visual layer needs a client-side motion
  system; the content layer needs a mature admin, validation and policy stack.
  Neither half compromises for the other.
- **Own the middleware to own the CSP.** Discussed above; this is the single
  most consequential structural decision in the front end.
- **Locale prefix always on.** `/fa`, `/en`, `/ar`, `/ru` — no bare paths. Export
  markets get stable, cacheable URLs and `hreflang` stays trivial to generate.
- **The device tier is measured, not guessed from the user agent.** Memory,
  cores, pointer type, WebGL support and Save-Data, resolved once per load and
  published on `<html data-tier>` so CSS can act on it without a React render.
- **Sanitise HTML on write.** Storing raw editor output and cleaning on read
  means every future consumer — a feed, an export, an app — must remember to
  clean it too. One of them will not.
