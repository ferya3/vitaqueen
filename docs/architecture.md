# Architecture

## The shape of the thing

```
                          INTERNET
                             │
                        CLOUDFLARE
                    DNS · WAF · DDoS · Bot · Cache · Turnstile
                             │
                           NGINX                 (origin, Cloudflare IPs only)
                             │
                   NEXT.JS 16 under pm2          127.0.0.1:3000
        ┌────────────────────┼─────────────────────┐
   public site          admin panel            /uploads
  /fa /en /ar /ru     /admin (Persian)      media route
        │                    │                     │
        └──────── src/server (server-only) ────────┘
                             │
              node:sqlite  ·  sharp  ·  node:crypto
                             │
               DATA_DIR/vitaqueen.db  ·  DATA_DIR/uploads
```

One process, one language. The public site, the CMS behind it and the media
server are the same Next.js application. The database is a file read through
Node's built-in `node:sqlite`, so there is no database server to install,
secure, back up separately or keep running.

The browser talks to that one origin and nothing else: data is read on the
server and every form posts to a Server Action, which is why `connect-src` in
the CSP is just `'self'`.

## The stack

| Concern | Choice |
| --- | --- |
| Language and runtime | TypeScript 5.9 on Node.js 22 (22.13+ for unflagged `node:sqlite`) |
| Framework | Next.js 16, App Router, React 19 |
| Styling | Tailwind CSS 4, tokens in `src/app/globals.css` |
| UI primitives | shadcn/ui style: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot` |
| Icons | `lucide-react` |
| Fonts | Vazirmatn and Plus Jakarta Sans, self-hosted via Fontsource |
| Motion | Framer Motion (page transitions, counters, tilt cards, menu), GSAP + ScrollTrigger through `@gsap/react` (pinned sequences, reveals, hero), Lenis (smooth scroll) |
| 3D | Three.js, React Three Fiber, Drei |
| Client state | Zustand (mobile menu) |
| Database | `node:sqlite`, WAL mode, plain SQL migrations |
| Images | `sharp`: every upload re-encoded to WebP |
| Passwords, sessions, 2FA, encryption | `node:crypto`: scrypt, random session tokens, TOTP, AES-256-GCM |
| Forms | Server Actions, validated on the server (zod for the public form) |
| Process manager | pm2 |
| Checks | `tsc --noEmit`, ESLint (zero warnings) |

## Five layers

| Layer | Where it lives |
| --- | --- |
| **1 · Brand** | `src/app/globals.css` (`@theme`), `config/site.ts`, `components/ui/Logo.tsx` |
| **2 · Experience** | `src/animations/**`, `components/motion/**`, `components/three/**` |
| **3 · Content** | `db/migrations`, `src/server/**`, `src/services/content.ts`, `src/app/admin/**` |
| **4 · Technology** | `apps/web`, `ecosystem.config.cjs`, `infra/scripts` |
| **5 · Security** | `src/proxy.ts`, `src/server/auth.ts`, `src/lib/roles.ts`, `src/server/media.ts`, `infra/nginx` |

## Directory layout

```
apps/web/
├── db/
│   ├── migrations/        0001_init.sql … — the schema, in plain SQL
│   └── core.mjs           open, migrate, scrypt — shared by the app and the CLI
├── scripts/db.mjs         migrate · create-admin · reset-password · reset-2fa · prune · backup
├── ecosystem.config.cjs   pm2
└── src/
    ├── app/
    │   ├── [locale]/      the public site, one directory per page
    │   ├── admin/         the CMS: login, 2FA, and (panel)/ behind requireAdmin
    │   └── uploads/       serves DATA_DIR/uploads
    ├── animations/        GSAP timelines and scroll hooks (useGSAP), no JSX
    ├── components/
    │   ├── admin/         panel UI: AdminForm, fields, forms/ per resource
    │   ├── motion/        Reveal, TextReveal, TiltCard, PageTransition …
    │   ├── ui/            primitives: Button (cva + Slot), Card, Field, Icons …
    │   └── three/ hero/ home/ products/ factory/ quality/ contact/ navigation/
    ├── content/samples.ts the sample catalogue written into a fresh database
    ├── server/            server-only: db, auth, totp, secrets, media, audit,
    │   │                  rate limits, markup renderer, seed
    │   └── actions/       'use server' modules — every export is an endpoint
    ├── services/content.ts what the public pages read
    ├── stores/            Zustand
    └── i18n/ lib/ hooks/ config/ types/
```

Animation code contains no JSX and components contain no GSAP. A component asks
for `<Reveal>` or `useHeroTimeline()`; it never writes a timeline inline.

## Data

### Schema and migrations

`db/migrations/NNNN_name.sql` files are applied in order by `migrate()` in
`db/core.mjs`, inside a single `BEGIN IMMEDIATE` transaction. The lock matters:
`next build` renders with several workers, each of which opens the database,
and without it two of them would both try to create version 1.

The application migrates on first use; `npm run db:migrate` does the same from
the command line, and the installer runs it before every build.

### Translations

Translatable columns hold JSON: `{"fa": "…", "en": "…", "ar": "…", "ru": "…"}`.
A per-model translation table would double every query for flexibility this
site does not need — four fixed locales, none with fields of its own.
`pick()` in `src/server/translations.ts` resolves the requested locale, then
English (what export markets read), then Persian, then anything present, so a
half-translated record renders instead of a blank.

### Sample content, and saying so

A new database is seeded once (`src/server/seed.ts`, marker in `meta`) with the
five bottle formats, a typical mineral analysis, the source profile, the eight
production stages and three unpublished legal-page drafts. Two rules:

1. **Nothing that would be a false claim.** No certificates, news or
   distributors are seeded. Legal pages are drafts until a person writes them.
2. **Sample figures are labelled.** The analysis and source profile carry
   `is_sample = 1`, and every page that shows them renders a notice in the
   visitor's language until an editor saves real laboratory figures and clears
   the flag. The admin dashboard nags about it too.

### Rendering and freshness

The locale layout reads the CSP nonce header, which makes every page dynamic:
each request renders from the database. `node:sqlite` is synchronous and
in-process, so a page's queries cost microseconds, and an admin save is visible
on the next request with no cache to invalidate. Server Actions still call
`revalidatePath('/', 'layout')`, so that stays true if any route becomes static
later. Cloudflare can cache the HTML at the edge.

### Rich text

News bodies and legal pages are stored as the editor typed them, in a small
markup (`## heading`, `- list`, `**bold**`, `[link](https://…)`).
`renderMarkup()` escapes everything first and then writes every tag itself, so
there is no sanitiser to get wrong and no stored HTML for a future consumer to
forget to clean.

## Admin panel

`/admin`, Persian and right-to-left, outside the locale tree with its own
document layout.

- **Every page and every action calls `requireAdmin(minRole)`.** Server Actions
  are public HTTP endpoints whichever page renders the form; hiding a button is
  not access control. The `'use server'` modules export nothing else — helpers
  that take a user id live in plain server-only modules.
- **Forms** are `AdminForm`: a Server Action through `useActionState`, submitted
  from `onSubmit` rather than `<form action>`, because React resets a form after
  an action passed that way — which would discard the editor's input and chosen
  files on a validation error.
- **Uploads** travel in the same multipart request as the text fields; the body
  limit is 40 MB (`next.config.ts`), per-file limits are in `src/server/media.ts`.
- **Roles** (`src/lib/roles.ts`): content manager → editor → admin → super admin.
  Content managers write but cannot publish or delete; editors publish, delete
  and read enquiries; admins manage users and read the audit log.

Resources: products (with images, datasheet, certificates), certificates, water
analyses, source profile, production stages, news, legal pages, distributors,
media library, enquiries, users, audit log, own account.

## What is deliberately not here

| Not built | Why, and what to do |
| --- | --- |
| **Email notifications** | Enquiries land in the admin inbox with an unread count. Sending mail needs an SMTP account and a mail library; add one when there is a mailbox to send to. |
| **Certificates** | No seed. Enter only documents the factory holds; expired ones drop off the site automatically. |
| **Photography and video** | `WaterBackdrop` generates the art; product images and stage media come from the admin panel. |
| **Cloudflare configuration** | Account settings, not repository files. `docs/security.md` lists what to enable. |
| **Off-site backups** | `npm run db:backup` makes a consistent copy; shipping it and `DATA_DIR/uploads` off the machine is a cron job for the operator. |

## Decisions worth remembering

- **One Node application instead of Next.js + Laravel.** One language, one
  process, one deploy, and an admin UI that did not exist before. The cost is
  that the CMS shares a process with the public site; for a factory website's
  traffic, that is the right trade.
- **SQLite in-process.** No database server to run or expose. WAL keeps reads
  flowing during writes; the single pm2 process avoids writer contention
  entirely.
- **Own the proxy to own the CSP.** `src/proxy.ts` negotiates the locale and
  sets a per-request nonce, which is what keeps `script-src` free of
  `unsafe-inline`.
- **Locale prefix always on.** `/fa`, `/en`, `/ar`, `/ru`; `hreflang` stays
  trivial.
- **The device tier is measured, not guessed.** Memory, cores, pointer, WebGL
  and Save-Data, published on `<html data-tier>` for CSS.
- **Fonts from npm, not Google.** The build must not depend on reaching
  fonts.googleapis.com.
