# Security

What is implemented in this repository, what has to be configured outside it,
and where the boundary between the two sits.

## Layers

```
Cloudflare   WAF · DDoS · bot rules · rate limiting · Turnstile · TLS   [account config]
    │
nginx        Cloudflare-only origin · per-route limits · body limits    [infra/nginx]
    │
proxy.ts     nonce CSP · security headers · locale routing · admin no-store   [src/proxy.ts]
    │
Server       requireAdmin on every page and action · roles · 2FA · audit ·
             DB-backed rate limits · upload re-encoding · escaped markup  [src/server]
    │
SQLite       a file under DATA_DIR, owned by the app user, never served    [ops]
```

No single layer is load-bearing on its own. Rate limits appear at three of
them on purpose.

## Front end

### Content Security Policy

`src/proxy.ts` mints a nonce per request — for the public site and the admin
panel alike — and sets:

```
default-src 'self';
script-src  'self' 'nonce-…' 'strict-dynamic';
style-src   'self' 'unsafe-inline';
img-src     'self' data: blob:;
font-src    'self';
connect-src 'self';
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
upgrade-insecure-requests        ← only when the request arrived over TLS
```

- **`strict-dynamic`** lets the Next bootstrap load its own chunks while still
  refusing any script the nonce did not authorise. One consequence found the
  hard way: Next loads a `template.tsx` chunk without the nonce, so the page
  transition lives in the layout instead.
- **`style-src 'unsafe-inline'`** is the one concession: Next, Framer Motion and
  GSAP set style attributes at runtime.
- **`connect-src 'self'`**: data is read on the server and forms post to
  Server Actions on the same origin.
- **`font-src 'self'`**: fonts are bundled from npm (Fontsource), never fetched
  from Google.
- **`upgrade-insecure-requests` is conditional.** On a plain-HTTP origin it
  rewrites every asset request to `https://`, and the page renders unstyled with
  no error that explains why.

Also set: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy` and HSTS. Admin responses add
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

### Contact form

1. Zod validation in the browser (a convenience).
2. The same schema again in the `submitContact` Server Action.
3. A honeypot field; a bot that fills it is told it succeeded.
4. Cloudflare Turnstile, verified server-side when `TURNSTILE_SECRET_KEY` is set.
5. Five submissions per ten minutes per address, counted in SQLite so a restart
   does not reset it.

The form also carries `method="post"`: if someone submits before the script has
hydrated, the browser's native fallback must not put their name and message in
a URL, where it would land in history, logs and the Referer header.

## Admin panel

### Authentication

- **scrypt** (`node:crypto`), N = 2¹⁵, r = 8, p = 1, 64-byte key, 16-byte salt.
  Parameters are stored with each hash (`scrypt$N$r$p$salt$hash`) and a login
  re-hashes anything weaker than today's setting.
- **Rate limited by address *and* account**: 20 failures per 15 minutes per IP,
  8 per account. By IP alone a botnet spreads the attack; by account alone one
  attacker locks everyone out.
- **Constant work on failure.** An unknown email is verified against a dummy
  hash, so timing cannot reveal which emails have accounts.
- **One generic failure message**, and every attempt audited.
- Minimum password length 12; generated passwords are 20 characters from an
  alphabet without look-alikes and shown exactly once.

### Sessions

- The cookie (`vq_admin`) holds 32 random bytes; the database holds only their
  SHA-256. A copy of the database contains no usable session.
- `HttpOnly`, `SameSite=Lax`, `Path=/admin`, and `Secure` whenever the request
  arrived over TLS. Scoping to `/admin` keeps it off every public request.
- 12-hour absolute lifetime, 2-hour idle timeout.
- The session is **re-issued under a new token** when the second factor is
  passed. Changing a password ends every other session; a role change, a
  deactivation or an admin password reset ends all of that user's sessions.

### Two-factor authentication

TOTP (RFC 6238, SHA-1, 6 digits, 30 s), implemented on `node:crypto`. Required
for editor, admin and super admin: such an account can reach only the
enrolment screen until it has confirmed a code.

- Secrets and recovery-code hashes are encrypted at rest with AES-256-GCM under
  a key derived from `APP_SECRET`; a database dump alone yields neither.
- Each accepted step is recorded, so a code cannot be replayed inside its window.
- Ten single-use recovery codes, stored as SHA-256 hashes, shown once.
- Regenerating codes or disabling 2FA asks for a current code; a lost phone is
  recovered by an admin ("reset 2FA") or on the server with
  `npm run db:reset-2fa`.

### Authorisation

`requireAdmin(minRole)` runs at the top of every admin page **and every Server
Action**. Server Actions are public HTTP endpoints regardless of which page
renders the form. Modules marked `'use server'` export only actions; anything
that takes a user id or similar lives in a plain server-only module, because
every export of a `'use server'` file is callable from the internet.

| Action | Minimum role |
| --- | --- |
| Read the panel, write and edit content, upload media | content manager |
| Publish, unpublish, delete content and media | editor |
| Read and handle enquiries | editor |
| Delete enquiries, manage users, read the audit log | admin |
| Delete a user account | super admin |

Nobody can assign a role above their own or edit a user who outranks them, and
nobody can change their own role or deactivate themselves.

Next.js checks the `Origin` of every Server Action request against the host,
which is the CSRF defence for the panel; nginx must pass `Host` through
unchanged (the shipped configs do).

### File uploads

- The browser's filename and type are never trusted. Images are **decoded and
  re-encoded by sharp** to WebP (max edge 2560 px, EXIF orientation applied,
  all metadata dropped). Whatever else the file contained — GPS coordinates, a
  polyglot payload — does not survive.
- `limitInputPixels` (50 MP) stops decompression bombs.
- PDFs must begin with `%PDF-` and are served with
  `Content-Security-Policy: sandbox`.
- SVG is refused: it is a document that can execute script.
- Stored names are 24 random hex characters under `YYYY/MM/`; the `/uploads`
  route accepts only paths of exactly that shape, so there is nothing to
  traverse.
- Limits: 12 MB per image, 20 MB per PDF, 40 MB per request, 60 uploads per
  user per hour in the media library.

### Rich text

The CMS stores what editors type, never HTML. `renderMarkup()` escapes the
whole input first and only then emits the handful of tags it recognises; links
are limited to `https?:`, `mailto:` and site-relative paths.

### Audit log and retention

Every create, update, delete, login (successful or not), 2FA event, upload and
password change is recorded with actor, IP, user agent and the names of the
fields that changed — never values, so no secret ends up in the log. The
application has no way to edit or delete a row.

Retention runs daily (from the dashboard, or `npm run db:prune` from cron):

- audit rows older than `AUDIT_RETENTION_DAYS` (730) are deleted;
- IP and user agent on enquiries older than `CONTACT_PII_RETENTION_DAYS` (90)
  are stripped, the enquiry itself kept;
- expired sessions and rate-limit counters are removed.

## Infrastructure

### The process and the data

- The site runs under pm2 as an **unprivileged user** (the installer refuses
  root), bound to `127.0.0.1:3000`. Nothing outside the machine reaches it
  except through nginx.
- `DATA_DIR` (default `apps/web/data`) holds the database and uploads, mode
  0750, owned by that user. It is outside anything nginx serves directly.
- `.env.local` is mode 0600 and holds `APP_SECRET`.

### nginx

`infra/nginx/vitaqueen.conf` is the production origin; install
`infra/nginx/snippets/vitaqueen-proxy.conf` alongside it.

- Only Cloudflare IP ranges may reach the origin; refresh the list on deploy.
- `real_ip_header CF-Connecting-IP`; nginx then **sets** `X-Real-IP` and
  `X-Forwarded-For` and clears any client-supplied `CF-Connecting-IP`. The
  application reads `X-Real-IP` first, so rate limits and the audit log cannot
  be fooled by a forged header.
- Limit zones: pages 30 r/s, admin 10 r/s, form POSTs 1 r/s.
- Body size 2 MB, raised to 40 MB under `/admin` only.
- `/admin` has an IP allow-list ready to uncomment; put Cloudflare Access in
  front as well.

`infra/nginx/vitaqueen-http.conf` is a plain-HTTP setup for reaching a fresh
server by IP. It is not a production configuration.

### Cloudflare (account configuration)

Enable DNS proxying, Full (strict) TLS with an origin certificate, HSTS
preload, WAF managed rules, DDoS protection, bot fight mode, rate limiting on
POSTs and on `/admin/*`, cache rules for `/_next/static/*` and `/uploads/*`,
Turnstile on the contact form, and Cloudflare Access in front of `/admin`.

### Backups

`npm run db:backup` writes a consistent copy with `VACUUM INTO` while the site
runs. Back up that file **and `DATA_DIR/uploads`**, daily, **off the server**,
and restore-test on a schedule. Copying the live `.db` with `cp` while WAL is
active is not a backup.

### Monitoring

`pm2 logs vitaqueen`, nginx access and error logs, and the audit log. Alert on
repeated `login_failed` from one address, an unexpected `two_factor_disabled`,
and a 5xx rate above baseline.

## Deployment checklist

- [ ] Site runs as an unprivileged user; the installer's temporary sudoers file is removed
- [ ] `APP_SECRET` set (the installer generates it); `.env.local` is 0600
- [ ] `NEXT_PUBLIC_SITE_URL` is the real domain and `NEXT_PUBLIC_ENV=production`; staging stays closed
- [ ] nginx from `infra/nginx/vitaqueen.conf`, Cloudflare-only origin, TLS origin certificate
- [ ] Port 3000 not reachable from outside (`ss -ltnp` shows 127.0.0.1)
- [ ] `/admin` behind an IP allow-list and/or Cloudflare Access
- [ ] First admin signed in, enrolled 2FA and stored the recovery codes
- [ ] Real laboratory figures entered; "sample data" flags cleared
- [ ] Legal pages written and published
- [ ] `npm run db:backup` and `DATA_DIR/uploads` copied off the server daily, restore-tested
