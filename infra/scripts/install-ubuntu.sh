#!/usr/bin/env bash
#
# VitaQueen — installer and updater for Ubuntu 24.04 LTS.
#
#   bash infra/scripts/install-ubuntu.sh
#
# Installs Node.js 22 and pm2, clones the repository, writes .env.local,
# creates the SQLite database and the first administrator, builds the site
# and starts it under pm2 on 127.0.0.1:3000.
#
# Re-running it is how you update: it pulls the branch, reinstalls
# dependencies, applies migrations, rebuilds and reloads pm2. An existing
# .env.local, database and uploads are never overwritten.
#
# Options (environment variables):
#   REPO_BRANCH=…        branch to deploy
#   INSTALL_DIR=…        where to clone (default ~/vitaqueen)
#   ADMIN_EMAIL=…        first administrator (default admin@vitaqueen.com)
#   SITE_URL=…           public origin, e.g. https://vitaqueen.com
#   WITH_NGINX=1         also install nginx as a plain-HTTP reverse proxy on
#                        port 80 (TLS and Cloudflare: see docs/security.md)
#   ALLOW_ROOT=1         run as root anyway (not recommended)

set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/ferya3/vitaqueen.git}"
REPO_BRANCH="${REPO_BRANCH:-claude/pensive-fermi-4owewq}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/vitaqueen}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@vitaqueen.com}"
SITE_URL="${SITE_URL:-}"
WITH_NGINX="${WITH_NGINX:-0}"
NODE_MAJOR=22
# node:sqlite works without a flag from 22.13.
NODE_MIN_MINOR=13

APP_DIR="$INSTALL_DIR/apps/web"

BOLD=$'\e[1m'; DIM=$'\e[2m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; RESET=$'\e[0m'
step()  { printf '\n%s==>%s %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$1" "$RESET"; }
info()  { printf '%s    %s%s\n' "$DIM" "$1" "$RESET"; }
warn()  { printf '%s !! %s%s\n' "$YELLOW" "$1" "$RESET"; }
die()   { printf '\n%s !! %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

trap 'die "Failed on line $LINENO. Nothing was rolled back; re-run once the cause is fixed."' ERR

# --- Preflight --------------------------------------------------------------

grep -q 'ID=ubuntu' /etc/os-release || warn "This script targets Ubuntu 24.04. Continuing anyway."

# A fresh VPS hands you a root shell. Everything this script writes would then
# be root-owned, and the site would run as root under pm2 — one bug away from
# owning the machine. So it asks for an ordinary user.
if [[ "$(id -u)" -eq 0 ]]; then
  if [[ "${ALLOW_ROOT:-0}" != "1" ]]; then
    die "Refusing to run as root.

    Create an unprivileged user with sudo and run it as them:

      adduser --disabled-password --gecos '' vitaqueen
      usermod -aG sudo vitaqueen
      install -m 440 /dev/stdin /etc/sudoers.d/vitaqueen <<< 'vitaqueen ALL=(ALL) NOPASSWD:ALL'
      sudo -iu vitaqueen

    then run this script again. Remove the sudoers file afterwards:

      rm /etc/sudoers.d/vitaqueen && passwd vitaqueen

    Or, if you know what you are trading away, re-run with ALLOW_ROOT=1."
  fi
  warn "Running as root (ALLOW_ROOT=1). Everything this writes will be root-owned."
  SUDO=()
  SUDO_E=()
else
  command -v sudo >/dev/null || die "sudo is required when not running as root."
  SUDO=(sudo)
  SUDO_E=(sudo -E)
  sudo -v || die "sudo authentication failed."
  # Keep the sudo timestamp alive for the length of the run.
  while true; do sudo -n true; sleep 50; kill -0 "$$" 2>/dev/null || exit; done 2>/dev/null &
  SUDO_KEEPALIVE=$!
  trap 'kill "$SUDO_KEEPALIVE" 2>/dev/null || true' EXIT
fi

export DEBIAN_FRONTEND=noninteractive
# Bounded timeouts, and IPv4 with no pipelining: the standard remedy for
# mirrors that stall on hosts with a broken IPv6 route or an unhappy proxy.
APT_OPTS=(
  -o "Acquire::http::Timeout=25"
  -o "Acquire::https::Timeout=25"
  -o "Acquire::Retries=2"
  -o "Acquire::ForceIPv4=true"
  -o "Acquire::http::Pipeline-Depth=0"
)

# --- Memory -----------------------------------------------------------------

# `next build` peaks well above a gigabyte. Without swap the kernel kills it,
# and all you see is the word "Killed".
SWAP_TARGET_MB="${SWAP_TARGET_MB:-4096}"

memory_total_mb() {
  awk '/^MemTotal:|^SwapTotal:/ {sum += $2} END {print int(sum / 1024)}' /proc/meminfo
}

ensure_swap() {
  local ram_mb swap_mb total_mb add_mb free_disk_mb
  ram_mb=$(awk '/^MemTotal:/ {print int($2 / 1024)}' /proc/meminfo)
  swap_mb=$(awk '/^SwapTotal:/ {print int($2 / 1024)}' /proc/meminfo)
  total_mb=$(( ram_mb + swap_mb ))
  info "${ram_mb} MB RAM, ${swap_mb} MB swap."

  (( total_mb >= SWAP_TARGET_MB )) && return 0

  if [[ -e /swapfile ]]; then
    warn "/swapfile exists but is not active; leaving it alone. Enable it with: sudo swapon /swapfile"
    return 0
  fi

  add_mb=$(( SWAP_TARGET_MB - total_mb ))
  (( add_mb < 1024 )) && add_mb=1024
  free_disk_mb=$(df -Pm / | awk 'NR == 2 {print $4}')
  if (( free_disk_mb < add_mb + 3072 )); then
    warn "Only ${free_disk_mb} MB free on /; not creating a swapfile. The build may be killed."
    return 0
  fi

  info "Adding ${add_mb} MB of swap so the production build is not killed."
  "${SUDO[@]}" fallocate -l "${add_mb}M" /swapfile 2>/dev/null \
    || "${SUDO[@]}" dd if=/dev/zero of=/swapfile bs=1M count="$add_mb" status=none
  "${SUDO[@]}" chmod 600 /swapfile
  "${SUDO[@]}" mkswap /swapfile >/dev/null
  if ! "${SUDO[@]}" swapon /swapfile 2>/dev/null; then
    warn "This host does not allow swap (a container?). Continuing without it."
    "${SUDO[@]}" rm -f /swapfile
    return 0
  fi
  grep -q '^/swapfile ' /etc/fstab 2>/dev/null \
    || echo '/swapfile none swap sw 0 0' | "${SUDO[@]}" tee -a /etc/fstab >/dev/null
}

step "Memory"
ensure_swap

# --- System packages --------------------------------------------------------

step "Base packages"
"${SUDO[@]}" apt-get "${APT_OPTS[@]}" update -qq
# sqlite3 is only the command-line client, for looking at the database by hand.
"${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq ca-certificates curl git gnupg openssl sqlite3

node_ok() {
  command -v node >/dev/null || return 1
  local major minor
  major=$(node -p 'process.versions.node.split(".")[0]')
  minor=$(node -p 'process.versions.node.split(".")[1]')
  (( major > NODE_MAJOR || (major == NODE_MAJOR && minor >= NODE_MIN_MINOR) ))
}

step "Node.js ${NODE_MAJOR}"
if ! node_ok; then
  curl -fsSL --retry 3 "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | "${SUDO_E[@]}" bash - >/dev/null
  "${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq nodejs
fi
node_ok || die "Node.js ${NODE_MAJOR}.${NODE_MIN_MINOR}+ is required; found $(node -v 2>/dev/null || echo none)."
info "node $(node -v), npm $(npm -v)"

step "pm2"
if ! command -v pm2 >/dev/null; then
  "${SUDO[@]}" npm install -g pm2 --no-audit --no-fund --loglevel=error
fi
info "pm2 $(pm2 -v)"

# --- Source -----------------------------------------------------------------

step "Source"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  info "Repository already at ${INSTALL_DIR}; updating to origin/${REPO_BRANCH}."
  git -C "$INSTALL_DIR" fetch --quiet origin "$REPO_BRANCH"
  git -C "$INSTALL_DIR" checkout --quiet -B "$REPO_BRANCH" "origin/$REPO_BRANCH"
else
  git clone --quiet --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi
info "At $(git -C "$INSTALL_DIR" log -1 --format='%h %s')"

# Left over from the Laravel version of this project, if this is an upgrade.
if [[ -d "$INSTALL_DIR/apps/api" ]] && ! git -C "$INSTALL_DIR" ls-files --error-unmatch apps/api >/dev/null 2>&1; then
  warn "apps/api is no longer part of the project (only untracked files remain there). It is safe to delete."
fi

cd "$APP_DIR"

# --- Configuration -----------------------------------------------------------

step "Configuration"
if [[ ! -f .env.local ]]; then
  # A real domain means production (robots.txt opens to crawlers); without one
  # the deployment stays closed to search engines.
  if [[ -n "$SITE_URL" ]]; then ENV_NAME=production; else ENV_NAME=development; fi
  cp .env.example .env.local
  sed -i \
    -e "s|^APP_SECRET=.*|APP_SECRET=$(openssl rand -hex 32)|" \
    -e "s|^NEXT_PUBLIC_ENV=.*|NEXT_PUBLIC_ENV=${ENV_NAME}|" \
    -e "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=${SITE_URL:-http://localhost:3000}|" \
    .env.local
  chmod 600 .env.local
  info "Wrote apps/web/.env.local with a fresh APP_SECRET."
else
  info "apps/web/.env.local exists — left untouched."
  grep -q '^APP_SECRET=.\+' .env.local || die "apps/web/.env.local has no APP_SECRET. Add one: APP_SECRET=\$(openssl rand -hex 32)"
fi

# --- Dependencies and database ----------------------------------------------

step "Dependencies"
info "Installing front-end and server dependencies."
npm ci --no-audit --no-fund --no-progress --loglevel=error

step "Database"
npm run -s db:migrate

# Only on a database with no users at all; a re-run never adds a second admin.
admin_output="$(npm run -s db:admin -- --if-none --email "$ADMIN_EMAIL" --name "VitaQueen Admin")"
printf '%s\n' "$admin_output"
if grep -q 'Password:' <<< "$admin_output"; then ADMIN_CREATED=1; else ADMIN_CREATED=0; fi

# --- Build ------------------------------------------------------------------

step "Build"
# Cap the heap at three quarters of what the machine has, so V8 collects
# instead of growing until the kernel steps in.
BUILD_HEAP_MB=$(( $(memory_total_mb) * 3 / 4 ))
(( BUILD_HEAP_MB > 4096 )) && BUILD_HEAP_MB=4096
(( BUILD_HEAP_MB < 1024 )) && BUILD_HEAP_MB=1024
info "Building with a ${BUILD_HEAP_MB} MB heap ceiling."

build_log="$(mktemp)"
if NODE_OPTIONS="--max-old-space-size=${BUILD_HEAP_MB}" NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | tee "$build_log"; then
  rm -f "$build_log"
else
  status=${PIPESTATUS[0]}
  if (( status == 137 )) || grep -qE 'Killed|JavaScript heap out of memory|SIGKILL' "$build_log"; then
    rm -f "$build_log"
    die "The build ran out of memory (exit ${status}). This machine has $(memory_total_mb) MB of RAM and swap combined.
    Add swap and re-run this script:

      sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
  fi
  rm -f "$build_log"
  die "The build failed (exit ${status}). The output above says why."
fi

# --- Run --------------------------------------------------------------------

step "pm2"
if pm2 describe vitaqueen >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env >/dev/null
  info "Reloaded the running site."
else
  pm2 start ecosystem.config.cjs >/dev/null
  info "Started the site."
fi
pm2 save >/dev/null

# Start on boot. `pm2 startup` prints the exact command it needs as root.
if [[ ! -f "/etc/systemd/system/pm2-$(id -un).service" ]] && command -v systemctl >/dev/null; then
  startup_cmd="$(pm2 startup systemd -u "$(id -un)" --hp "$HOME" | grep -E '^sudo ' || true)"
  if [[ -n "$startup_cmd" ]]; then
    info "Registering pm2 with systemd so the site starts on boot."
    eval "$startup_cmd" >/dev/null
  else
    "${SUDO[@]}" env PATH="$PATH" pm2 startup systemd -u "$(id -un)" --hp "$HOME" >/dev/null || warn "Could not register pm2 at boot; run 'pm2 startup' yourself."
  fi
fi

for attempt in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/fa; then break; fi
  (( attempt == 30 )) && die "The site did not answer on 127.0.0.1:3000. Check: pm2 logs vitaqueen"
  sleep 1
done
info "Answering on http://127.0.0.1:3000"

# --- nginx (optional) -------------------------------------------------------

if [[ "$WITH_NGINX" == "1" ]]; then
  step "nginx"
  "${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq nginx
  "${SUDO[@]}" install -m 644 "$INSTALL_DIR/infra/nginx/vitaqueen-http.conf" /etc/nginx/sites-available/vitaqueen
  "${SUDO[@]}" ln -sfn /etc/nginx/sites-available/vitaqueen /etc/nginx/sites-enabled/vitaqueen
  "${SUDO[@]}" rm -f /etc/nginx/sites-enabled/default
  "${SUDO[@]}" nginx -t
  "${SUDO[@]}" systemctl reload nginx 2>/dev/null || "${SUDO[@]}" service nginx reload
  if command -v ufw >/dev/null && "${SUDO[@]}" ufw status | grep -q 'Status: active'; then
    "${SUDO[@]}" ufw allow 'Nginx HTTP' >/dev/null
  fi
  info "nginx proxies port 80 to the site."
fi

# --- Done -------------------------------------------------------------------

step "Done"
cat <<EOF

  ${BOLD}The site${RESET}
    pm2 status / pm2 logs vitaqueen / pm2 reload vitaqueen
    http://127.0.0.1:3000/fa            public site
    http://127.0.0.1:3000/admin         admin panel
$( [[ "$WITH_NGINX" == "1" ]] && echo "    http://<server-ip>/                 through nginx" )

  ${BOLD}From your own computer, without opening a port${RESET}
    ssh -L 3000:127.0.0.1:3000 $(id -un)@<server-ip>    then open http://localhost:3000

  ${BOLD}Update${RESET}
    re-run this script

  ${BOLD}Maintenance${RESET} (in ${APP_DIR})
    npm run db:backup                    copy of the database (plus back up data/uploads)
    npm run db:admin -- --email …        another administrator
    npm run db:password -- --email …     reset a password
    npm run db:reset-2fa -- --email …    remove a lost second factor

EOF

if [[ "$ADMIN_CREATED" == "1" ]]; then
  warn "The admin password was printed once, above. Store it now — you will set up 2FA at first sign-in."
fi
warn "Before going live on a domain: TLS, Cloudflare and the origin firewall — see docs/security.md."
