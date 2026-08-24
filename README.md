# VitaQueen

Website and content platform for a natural mineral water factory: a brand
experience on the public side, a real CMS behind it, and the security posture a
production industrial site actually needs.

```
apps/web     Next.js 16 · React 19 · TypeScript · Tailwind 4 · GSAP · Lenis · Three.js
apps/api     Laravel 13 · PHP 8.4 · MySQL 8 · Redis
infra/       nginx origin config, local Docker services
docs/        architecture, design system, motion map, security, API reference
```

## What is here

- **Four locales from the first commit** — Persian, English, Arabic, Russian,
  with RTL handled in layout, typography *and* motion. The site currently
  *serves* Persian only: `locales` in `apps/web/src/i18n/routing.ts` is the
  single switch, and the other three catalogues are complete and waiting in
  `apps/web/messages/`.
- **A scroll-driven home page** that walks the visitor from the spring to the
  sealed bottle, and a factory page that does the same through the production
  line.
- **Progressive enhancement, enforced** — 3D → video → static art, chosen by a
  measured device tier, with reduced-motion honoured everywhere.
- **A CMS** covering products, certificates, water analyses, the source profile,
  production stages, news, pages, distributors, media and enquiries.
- **Security that is implemented, not described** — nonce-based CSP, Argon2id,
  TOTP second factor, role-based policies, an append-only audit log, upload
  hardening, layered rate limits and enforced data retention.

## Install on Ubuntu 24.04

One line. Installs PHP 8.4, Node 22, Composer, MySQL and Redis, creates a
least-privileged database user, clones the repository, wires both `.env` files
to each other, migrates, seeds and builds:

```bash
curl -fsSL https://raw.githubusercontent.com/ferya3/vitaqueen/claude/mineral-water-factory-site-q39765/infra/scripts/install-ubuntu.sh | bash
```

If the repository is private, clone first and run the script from disk:

```bash
git clone -b claude/mineral-water-factory-site-q39765 https://github.com/ferya3/vitaqueen.git && bash vitaqueen/infra/scripts/install-ubuntu.sh
```

It is idempotent — re-running never overwrites an existing `.env`.

**A fresh VPS drops you into a root shell, and the script refuses to run there.**
Everything it writes would be root-owned, Composer skips its plugins under root
unless told otherwise, and the processes you start afterwards inherit the habit.
Create an unprivileged user first:

```bash
adduser --disabled-password --gecos '' vitaqueen && usermod -aG sudo vitaqueen \
  && install -m 440 /dev/stdin /etc/sudoers.d/vitaqueen <<< 'vitaqueen ALL=(ALL) NOPASSWD:ALL' \
  && sudo -iu vitaqueen bash -c 'curl -fsSL https://raw.githubusercontent.com/ferya3/vitaqueen/claude/mineral-water-factory-site-q39765/infra/scripts/install-ubuntu.sh | bash'
```

Then take the passwordless sudo back off once the install has finished:

```bash
rm /etc/sudoers.d/vitaqueen && passwd vitaqueen
```

`ALLOW_ROOT=1` overrides the refusal if you have a reason to accept the
trade-off.

The script deliberately does not touch nginx, TLS or Cloudflare; those are
deployment decisions, covered in [docs/security.md](docs/security.md).

## Quick start (manual)

```bash
# Services (MySQL, Redis, Mailpit)
docker compose -f infra/docker/docker-compose.yml up -d

# API
cd apps/api
cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # prints the generated admin password once
php artisan serve                   # http://127.0.0.1:8000

# Front end
cd ../web
cp .env.example .env.local          # set API_URL=http://127.0.0.1:8000/api/v1
npm install
npm run dev                         # http://localhost:3000 → redirects to /fa
```

The front end runs without the API. Every content service falls back to seeded
sample data and the page says so, in the visitor's language, wherever numbers
are involved — so you can develop the whole site before the CMS has a single
row in it.

## Checks

```bash
cd apps/web && npm run check     # tsc --noEmit + eslint, zero warnings
cd apps/api && ./vendor/bin/pint --test && php artisan test
```

## Documentation

| Document | What it answers |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | How the pieces fit, and why each choice was made |
| [docs/design-system.md](docs/design-system.md) | Colour, type, spacing, components, RTL |
| [docs/motion-map.md](docs/motion-map.md) | Every animation: where it lives, what it costs, how it degrades |
| [docs/security.md](docs/security.md) | The full posture, app and infrastructure, including what is *not* done here |
| [docs/api.md](docs/api.md) | Endpoint reference and payload shapes |

## Before this goes live

Three things in this repository are deliberately empty or marked as samples,
and putting real values in them is a business decision, not a coding task:

1. **Certificates.** There is no seeded certificate and no fallback list. Only
   documents the factory actually holds and can produce on request belong here.
2. **Water analysis figures.** The seeded analysis is unpublished and the site
   labels it as sample data wherever it appears. Replace it with the real
   certificate of analysis and publish that.
3. **Photography.** Backgrounds are generated vector art rather than stock
   photos of somebody else's mountain. `MediaLayer` swaps in real assets the
   moment they exist.

See [docs/architecture.md](docs/architecture.md#what-is-deliberately-not-here)
for the rest.
