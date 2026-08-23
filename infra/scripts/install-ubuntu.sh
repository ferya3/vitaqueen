#!/usr/bin/env bash
#
# VitaQueen — one-shot installer for Ubuntu 24.04 LTS.
#
#   curl -fsSL .../install-ubuntu.sh | bash          # or
#   bash infra/scripts/install-ubuntu.sh
#
# Idempotent: safe to re-run. Anything already installed is left alone, and an
# existing .env is never overwritten.
#
# What it does NOT do: nothing here touches nginx site configuration, TLS or
# Cloudflare. Those are deployment decisions — see infra/nginx/vitaqueen.conf
# and docs/security.md. This gets a working stack on a box, nothing more.

set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/ferya3/vitaqueen.git}"
REPO_BRANCH="${REPO_BRANCH:-claude/mineral-water-factory-site-q39765}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/vitaqueen}"
DB_NAME="${DB_NAME:-vitaqueen}"
DB_USER="${DB_USER:-vitaqueen_app}"
PHP_VERSION="8.4"
PHP_BIN="php8.4"
NODE_MAJOR="22"

BOLD=$'\e[1m'; DIM=$'\e[2m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; RESET=$'\e[0m'
step()  { printf '\n%s==>%s %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$1" "$RESET"; }
info()  { printf '%s    %s%s\n' "$DIM" "$1" "$RESET"; }
warn()  { printf '%s !! %s%s\n' "$YELLOW" "$1" "$RESET"; }
die()   { printf '\n%s !! %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

trap 'die "Failed on line $LINENO. Nothing was rolled back; re-run once the cause is fixed."' ERR

# --- Preflight --------------------------------------------------------------

[[ "$(id -u)" -ne 0 ]] || die "Run this as a normal user with sudo, not as root. Composer and npm both misbehave under root."
command -v sudo >/dev/null || die "sudo is required."
grep -q 'ID=ubuntu' /etc/os-release || warn "This script targets Ubuntu 24.04. Continuing anyway."

SUDO="sudo"
$SUDO -v || die "sudo authentication failed."

# Keep the sudo timestamp alive for the length of the run.
while true; do $SUDO -n true; sleep 50; kill -0 "$$" 2>/dev/null || exit; done 2>/dev/null &
SUDO_KEEPALIVE=$!
trap 'kill "$SUDO_KEEPALIVE" 2>/dev/null || true' EXIT

export DEBIAN_FRONTEND=noninteractive

# --- System packages --------------------------------------------------------

step "Base packages"
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq \
  ca-certificates curl git gnupg unzip openssl lsb-release software-properties-common

step "PHP ${PHP_VERSION}"
# Ubuntu 24.04 ships PHP 8.3; 8.4 comes from Ondřej Surý's archive.
if ! command -v "php${PHP_VERSION}" >/dev/null; then
  $SUDO add-apt-repository -y ppa:ondrej/php >/dev/null
  $SUDO apt-get update -qq
fi
$SUDO apt-get install -y -qq \
  "php${PHP_VERSION}-cli" "php${PHP_VERSION}-fpm" \
  "php${PHP_VERSION}-mbstring" "php${PHP_VERSION}-xml" "php${PHP_VERSION}-curl" \
  "php${PHP_VERSION}-zip" "php${PHP_VERSION}-intl" "php${PHP_VERSION}-bcmath" \
  "php${PHP_VERSION}-gd" "php${PHP_VERSION}-mysql" "php${PHP_VERSION}-redis" \
  "php${PHP_VERSION}-sqlite3"
info "$("$PHP_BIN" -v | head -1)"

step "Composer"
if ! command -v composer >/dev/null; then
  EXPECTED="$(curl -fsSL https://composer.github.io/installer.sig)"
  curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
  ACTUAL="$("$PHP_BIN" -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
  # The installer is fetched over the network and then run as PHP. Verifying it
  # against the published signature is the whole reason this is four lines.
  [[ "$EXPECTED" == "$ACTUAL" ]] || die "Composer installer checksum mismatch — refusing to run it."
  $SUDO "$PHP_BIN" /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
fi
info "$("$PHP_BIN" "$(command -v composer)" --version)"

step "Node ${NODE_MAJOR}"
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | $SUDO -E bash - >/dev/null
  $SUDO apt-get install -y -qq nodejs
fi
info "node $(node -v), npm $(npm -v)"

step "MySQL and Redis"
$SUDO apt-get install -y -qq mysql-server redis-server
$SUDO systemctl enable --now mysql redis-server >/dev/null 2>&1 || true

# --- Database ---------------------------------------------------------------

step "Database"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
if $SUDO mysql -N -e "SELECT 1 FROM mysql.user WHERE user='${DB_USER}'" | grep -q 1; then
  info "User ${DB_USER} already exists; leaving its password alone."
  DB_PASSWORD=""
else
  # Grants are limited to this one schema. The application never connects as root.
  $SUDO mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
  info "Created database ${DB_NAME} and user ${DB_USER}."
fi

# --- Source -----------------------------------------------------------------

step "Source"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  info "Repository already at ${INSTALL_DIR}; fetching."
  git -C "$INSTALL_DIR" fetch --quiet origin "$REPO_BRANCH"
  git -C "$INSTALL_DIR" checkout --quiet -B "$REPO_BRANCH" "origin/$REPO_BRANCH"
else
  git clone --quiet --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi

INTERNAL_TOKEN="$(openssl rand -hex 32)"

# --- API --------------------------------------------------------------------

step "API"
cd "$INSTALL_DIR/apps/api"
"$PHP_BIN" "$(command -v composer)" install --no-interaction --prefer-dist --quiet

if [[ ! -f .env ]]; then
  cp .env.example .env
  # Local install: debug on, mail to the log, and the real database credentials.
  sed -i \
    -e "s|^APP_ENV=.*|APP_ENV=local|" \
    -e "s|^APP_DEBUG=.*|APP_DEBUG=true|" \
    -e "s|^APP_URL=.*|APP_URL=http://127.0.0.1:8000|" \
    -e "s|^DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" \
    -e "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" \
    -e "s|^MAIL_MAILER=.*|MAIL_MAILER=log|" \
    -e "s|^INTERNAL_API_TOKEN=.*|INTERNAL_API_TOKEN=${INTERNAL_TOKEN}|" \
    .env
  "$PHP_BIN" artisan key:generate --ansi --quiet
else
  warn "apps/api/.env exists — left untouched. Check DB_PASSWORD and INTERNAL_API_TOKEN yourself."
  INTERNAL_TOKEN="$(grep -E '^INTERNAL_API_TOKEN=' .env | cut -d= -f2- || true)"
fi

"$PHP_BIN" artisan migrate --seed --force --ansi 2>&1 | tail -20
"$PHP_BIN" artisan storage:link --quiet 2>/dev/null || true

# --- Front end --------------------------------------------------------------

step "Front end"
cd "$INSTALL_DIR/apps/web"
npm ci --no-audit --no-fund --silent

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  sed -i \
    -e "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:3000|" \
    -e "s|^API_URL=.*|API_URL=http://127.0.0.1:8000/api/v1|" \
    -e "s|^NEXT_PUBLIC_ENV=.*|NEXT_PUBLIC_ENV=development|" \
    -e "s|^API_TOKEN=.*|API_TOKEN=${INTERNAL_TOKEN}|" \
    .env.local
else
  warn "apps/web/.env.local exists — left untouched."
fi

npm run build

# --- Done -------------------------------------------------------------------

step "Done"
cat <<EOF

  ${BOLD}Start it${RESET}
    cd ${INSTALL_DIR}/apps/api && ${PHP_BIN} artisan serve   ${DIM}# http://127.0.0.1:8000${RESET}
    cd ${INSTALL_DIR}/apps/web && npm run dev            ${DIM}# http://localhost:3000  →  /fa${RESET}

  ${BOLD}Checks${RESET}
    cd ${INSTALL_DIR}/apps/api && ${PHP_BIN} artisan test && ./vendor/bin/pint --test
    cd ${INSTALL_DIR}/apps/web && npm run check

EOF

if [[ -n "$DB_PASSWORD" ]]; then
  warn "Database password for ${DB_USER} was generated and written to apps/api/.env only."
fi
warn "The admin password was printed once by the seeder, above. Store it now — enrol 2FA at first login."
