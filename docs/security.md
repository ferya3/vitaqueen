# Security

What is implemented in this repository, what has to be configured outside it,
and where the boundary between the two sits.

## Layers

```
Cloudflare   WAF · DDoS · bot rules · rate limiting · Turnstile · TLS   [account config]
    │
nginx        Cloudflare-only origin · per-route limits · no PHP under uploads   [infra/nginx]
    │
Next.js      nonce CSP · security headers · locale routing · form gate   [src/proxy.ts]
    │
Laravel      validation · policies · Sanctum · 2FA · audit · rate limits   [apps/api]
    │
MySQL        private interface · least-privileged user   [ops]
```

No single layer is load-bearing on its own. The rate limiter appears three
times on purpose.

## Front end

### Content Security Policy

`src/proxy.ts` mints a nonce per request and sets:

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

Three notes:

- **`strict-dynamic`** lets the Next bootstrap load its own chunks while still
  refusing any script the nonce did not authorise.
- **`style-src 'unsafe-inline'`** is the one concession. Next and Motion both
  set style attributes at runtime and there is no nonce-based alternative for
  those.
- **`connect-src 'self'`** is possible because the browser never calls the API —
  the API origin is not even in the client bundle.
- **`upgrade-insecure-requests` is conditional.** It is emitted only when
  `x-forwarded-proto` (nginx, Cloudflare) or the connection itself says https.
  On a plain-HTTP origin it rewrites every stylesheet, script and font request
  to `https://`, and if nothing is listening for TLS on that port the page
  renders unstyled with no error that explains why. It protects an https page;
  on an http one it only breaks things.

Getting a real nonce is the reason locale routing is hand-written rather than
delegated. Owning the response is the only way to rewrite the request headers
Next reads the nonce from.

Also set: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy` (camera, microphone, geolocation, payment and FLoC all
off), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` and HSTS.

### Contact form

Four gates before a message reaches the API:

1. Zod validation in the browser (a convenience, nothing more).
2. The same Zod schema again in the route handler — the browser is outside the
   trust boundary.
3. A honeypot field. A filled hidden field means a bot, and a bot gets a silent
   `204`.
4. Cloudflare Turnstile, verified server-side when `TURNSTILE_SECRET_KEY` is
   configured.

Plus a per-IP limiter in the route handler (five per ten minutes). It is
per-instance and resets on deploy — the authoritative limits are in Laravel and
at the edge. The upstream response body is never echoed to the client: it can
carry stack traces or field names a public form has no business learning.

## Back end

### Authentication

- **Argon2id** (`config/hashing.php`), 64 MiB / 4 iterations / 2 threads. Tune
  on the production hardware: too low is cheap to attack, too high turns the
  login endpoint into its own denial of service.
- **Rate limited by email *and* address.** By IP alone, a botnet spreads the
  attack; by email alone, one attacker locks every account out. Both keys.
- **Constant work on failure.** An unknown email still spends the cost of a
  hash, so response timing cannot answer "does this account exist?".
- **One generic failure message.** Wrong password, disabled account and unknown
  user are indistinguishable from outside.
- **Every attempt audited**, successful or not. A brute-force run is only
  visible if the failures were written down.
- **Short-lived Sanctum tokens**, one per device, with abilities derived from
  the role. `sanctum:prune-expired` runs daily.

### Two-factor authentication

TOTP, required for super admin, admin and editor
(`vitaqueen.security.two_factor_required_roles`). `EnsureTwoFactorIsEnabled`
blocks a privileged account that has not enrolled, while leaving the enrolment
endpoints reachable — otherwise the requirement would lock people out of the
screens that satisfy it.

The secret is encrypted at rest, and recovery codes are stored **hashed**: if
the table leaks, the codes in it are not usable, which is the entire point of
having them. The pending secret lives in the cache for ten minutes during
enrolment, so a setup abandoned halfway never becomes the thing that locks
someone out.

### Authorisation

Roles are ordered — `super_admin` > `admin` > `editor` > `content_manager` —
and policies ask `atLeast()` rather than comparing strings.

| Action | Minimum role |
| --- | --- |
| Read and edit content | content manager |
| Upload media | content manager |
| Publish, delete content, delete media | editor |
| Enter a water analysis | editor |
| Read the enquiry inbox | editor |
| Edit or withdraw a published analysis | admin |
| Read the audit log, manage users | admin |
| Delete a user account | super admin |

Two constraints worth stating: nobody can assign a role above their own, and
changing a role, password or active flag deletes that account's tokens so no
live token keeps the old abilities.

### File uploads

The threat is not an ugly picture. It is `logo.php`, or `logo.php.jpg`, or a
JPEG whose bytes are a PHP script.

- The extension is derived from the **sniffed** MIME type, never from the name
  the browser sent.
- The MIME type must be on the allow-list for the requested category.
- Filenames containing `.php`, `.phar`, `.phtml`, `.cgi`, `.htaccess` and
  friends — in any position — are refused outright. The stored name is a random
  ULID, so they could not reach disk anyway, but a file called
  `invoice.php.pdf` is not a mistake.
- Per-category size ceilings: 8 MB images, 20 MB documents, 200 MB video.
- SVG is refused unless `VITAQUEEN_ALLOW_SVG` is deliberately set. An SVG is a
  document that can execute script.
- Documents go to a **private** disk and are served through 15-minute signed
  URLs. Only images are web-readable.
- nginx serves both upload roots through `internal` locations with no PHP
  handler in scope, so nothing under them is executable even if it got there.

### Input and output

- `FormRequest` on every write, with `array:fa,en,ar,ru` on translatable fields
  so a typo'd locale key cannot silently create a fifth language.
- HTML from the editor is sanitised **on write** by HTMLPurifier against a
  narrow allow-list: no `script`, no `iframe`, no inline styles, no `on*`
  handlers, no `javascript:` or `data:` URLs. Sanitising on read would mean
  every future consumer has to remember to do it too.
- Errors render as JSON on every `api/*` route, and with `APP_DEBUG=false`
  Laravel returns `{"message": "Server Error"}` and nothing else. There is
  deliberately no custom catch-all renderer on top of that: an over-eager one
  swallows the exceptions the framework renders correctly and turns a `422`
  into a `500`. The test suite runs with debug off for the same reason.
- `SecurityHeaders` puts `default-src 'none'; sandbox` on API responses: JSON is
  never a document.

### Rate limits

| Bucket | Limit | Key |
| --- | --- | --- |
| `public-api` | 120/min | IP — skipped for the internal renderer token |
| `contact` | 3/min, 30/day | IP |
| `login` | 5/min | IP and email |
| `uploads` | 20/min | User |

The Next.js renderer is one machine serving every visitor, so a per-IP limit
would throttle the whole site on a cold cache. It identifies itself with
`INTERNAL_API_TOKEN`, compared with `hash_equals`.

`TRUSTED_PROXIES` must name Cloudflare and nginx explicitly. A wildcard there
lets anyone who reaches the origin forge `X-Forwarded-For` and walk past every
per-IP limit in this table.

### Audit log and retention

Every create, update and delete is recorded with the actor, the IP, the
timestamp, the resource and the **diff**. There is no update or delete endpoint:
an audit log you can edit is a log you cannot cite.

`vitaqueen:prune` runs daily and enforces two clocks:

- Audit rows: deleted after `AUDIT_RETENTION_DAYS` (default 730).
- The IP address and user agent on a contact message: stripped after
  `CONTACT_PII_RETENTION_DAYS` (default 90), while the enquiry itself is kept.
  They exist to investigate abuse; after that window they are personal data with
  no purpose.

## Infrastructure

### Database

```
Internet  ──✗──  MySQL
```

Bind MySQL to the private interface or a socket. Port 3306 must not be reachable
from the internet, and the application connects as `vitaqueen_app` with grants
limited to its own schema — never `root`.

### nginx

- Only Cloudflare IP ranges may reach the origin; refresh the list on deploy.
- `real_ip_header CF-Connecting-IP`, so limits key on the visitor.
- Per-route limit zones: pages 30 r/s, API 10 r/s, contact 1 r/s.
- `/api/v1/admin/` is IP-restricted at the edge of the origin as well. Uncomment
  the office and VPN ranges, and put Cloudflare Access in front.
- `server_tokens off`, `X-Powered-By` hidden, dotfiles and framework
  directories denied.

### Cloudflare (account configuration, not in this repository)

Enable: DNS proxying, Full (strict) TLS with an origin certificate, HSTS
preload, WAF managed rules, DDoS protection, bot fight mode, rate limiting on
`/api/v1/contact` and `/api/v1/admin/*`, cache rules for `/_next/static/*` and
`/media/*`, and Turnstile on the contact form. Consider Cloudflare Access in
front of the admin API instead of relying only on IP allow-lists.

### Backups

Daily database dump, weekly full backup, **stored off the production host**. A
backup on the same server as the site is, security-wise, close to keeping the
safe key inside the safe. Restore-test on a schedule; an untested backup is a
hypothesis.

### Monitoring

Sentry for both applications, uptime checks against `/up` (Laravel's health
endpoint, already routed) and the front end, plus nginx access and error logs,
Laravel logs, and the audit log. Alert on: repeated `login_failed` from one
address, an unexpected `two_factor_disabled`, and a 5xx rate above baseline.

## Deployment checklist

- [ ] `APP_DEBUG=false`, `APP_ENV=production`, `APP_KEY` generated
- [ ] `TRUSTED_PROXIES` names Cloudflare and nginx — never `*`
- [ ] `INTERNAL_API_TOKEN` set on both sides and rotated on a schedule
- [ ] `REQUIRE_API=true` on the front end once the CMS is live
- [ ] `NEXT_PUBLIC_ENV=production` so `robots.txt` opens; keep staging closed
- [ ] MySQL not listening publicly; app user is not `root`
- [ ] Redis password set and bound to localhost
- [ ] `php artisan config:cache route:cache`
- [ ] Scheduler running (`vitaqueen:prune`, `sanctum:prune-expired`)
- [ ] First admin has enrolled 2FA and stored the recovery codes
- [ ] Off-site backups running and restore-tested
