# VitaQueen

Website and content platform for a natural mineral water factory: a brand
experience on the public side, a real CMS behind it, and the security posture a
production industrial site actually needs.

One Node.js application — no PHP, no database server:

```
apps/web     Next.js 16 · React 19 · TypeScript 5.9 · Tailwind 4 · Node.js 22
             public site in four languages + Persian admin panel at /admin
             node:sqlite · sharp · node:crypto · Server Actions · pm2
infra/       installer, pm2-ready nginx configs
docs/        architecture, design system, motion map, security
```

## What is here

- **Four locales** — Persian, English, Arabic, Russian, with RTL handled in
  layout, typography *and* motion.
- **A scroll-driven home page** from spring to sealed bottle, and a factory page
  that walks the production line (GSAP ScrollTrigger pinning, Lenis smooth
  scroll, Framer Motion transitions, counters and tilt cards, a Three.js bottle).
- **A CMS with a real admin panel** — products, certificates, water analyses,
  the source profile, production stages, news, legal pages, distributors, a
  media library, the enquiry inbox, users and the audit log — in Persian, with
  every text field in all four languages.
- **Security that is implemented, not described** — nonce-based CSP, scrypt
  passwords, TOTP second factor with recovery codes, role-based access on every
  Server Action, an append-only audit log, uploads re-encoded by sharp, rate
  limits stored in the database, and enforced data retention.

### The stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript 5.9, Node.js 22 |
| Styling and UI | Tailwind CSS 4; shadcn/ui-style primitives with class-variance-authority, clsx, tailwind-merge and @radix-ui/react-slot; lucide-react icons; Vazirmatn via Fontsource |
| Motion and 3D | Framer Motion, GSAP + ScrollTrigger (@gsap/react), Lenis, Three.js + React Three Fiber + Drei |
| Client state | Zustand |
| Server | `node:sqlite` (built into Node), sharp, `node:crypto`, Server Actions |
| Operations | pm2, ESLint, `tsc` |

The full list with exact versions is in `apps/web/package.json`.

## Install on Ubuntu 24.04

The installer sets up Node.js 22 and pm2, clones the repository, writes
`.env.local` with a fresh `APP_SECRET`, creates the database and the first
administrator (the password is printed **once**), builds, and starts the site
under pm2 on `127.0.0.1:3000`. Re-running it updates the site.

A fresh VPS gives you a root shell, and the installer refuses to run as root.
As root, create a user and switch to it:

```bash
apt update && apt install -y git
adduser --disabled-password --gecos '' vitaqueen
usermod -aG sudo vitaqueen
install -m 440 /dev/stdin /etc/sudoers.d/vitaqueen <<< 'vitaqueen ALL=(ALL) NOPASSWD:ALL'
sudo -iu vitaqueen
```

As `vitaqueen`:

```bash
git clone -b claude/pensive-fermi-4owewq https://github.com/ferya3/vitaqueen.git ~/vitaqueen
ADMIN_EMAIL=you@example.com WITH_NGINX=1 bash ~/vitaqueen/infra/scripts/install-ubuntu.sh
```

`WITH_NGINX=1` adds nginx on port 80 so the server answers by IP; leave it out
and use an SSH tunnel instead (`ssh -L 3000:127.0.0.1:3000 vitaqueen@<ip>`).
Pass `SITE_URL=https://your.domain` once there is a domain.

Back as root, take the passwordless sudo away again:

```bash
rm /etc/sudoers.d/vitaqueen && passwd vitaqueen
```

Then open `/admin`, sign in, and set up two-factor authentication on the first
screen. TLS, Cloudflare and the origin firewall are covered in
[docs/security.md](docs/security.md).

### Day to day (in `~/vitaqueen/apps/web`)

```bash
pm2 status | pm2 logs vitaqueen          # is it up, what is it saying
bash ~/vitaqueen/infra/scripts/install-ubuntu.sh   # pull, migrate, build, reload
npm run db:backup                        # consistent copy of the database
npm run db:admin -- --email x@y.com      # another administrator
npm run db:password -- --email x@y.com   # forgotten password
npm run db:reset-2fa -- --email x@y.com  # lost phone
npm run db:prune                         # retention (also runs daily from the panel)
```

Back up `data/backups/*.db` **and** `data/uploads/` off the server.

## Development

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run db:admin -- --email you@example.com   # prints a password once
npm run dev                                   # http://localhost:3000 → /fa, admin at /admin
```

The database is created and filled with the sample catalogue on first use, in
`apps/web/data/`. Delete that directory to start over.

## Checks

```bash
cd apps/web && npm run check     # tsc --noEmit + eslint, zero warnings
cd apps/web && npm run build
```

## Documentation

| Document | What it answers |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | How the pieces fit, the data model, the admin panel, and why |
| [docs/design-system.md](docs/design-system.md) | Colour, type, spacing, components, RTL |
| [docs/motion-map.md](docs/motion-map.md) | Every animation: where it lives, what it costs, how it degrades |
| [docs/security.md](docs/security.md) | The full posture, app and infrastructure, and the go-live checklist |

## Before this goes live

Three things are deliberately empty or marked as samples, and filling them is a
business decision, not a coding task — all of them are now done from the admin
panel:

1. **Certificates.** None are seeded. Enter only documents the factory holds.
2. **Water analysis and source figures.** The seeded values are flagged as
   sample data and the site says so to visitors. Enter the laboratory's figures
   and clear the flag.
3. **Legal pages.** Privacy, terms and cookies exist as unpublished drafts until
   someone writes the real text.
