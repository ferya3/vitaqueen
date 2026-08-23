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
# 8.4 is preferred but not required: composer.json asks for ^8.3, and Ubuntu
# 24.04 ships 8.3 in its own archive. Both are resolved at runtime, so a server
# that cannot reach Launchpad still gets a working install.
PHP_PREFERRED="8.4"
PHP_FALLBACK="8.3"
PHP_VERSION=""
PHP_BIN=""
NODE_MAJOR="22"

# Signing key for ppa:ondrej/php — "Launchpad PPA for Ondřej Surý". Pinned so
# the manual fallback below cannot be talked into trusting a different key.
ONDREJ_PHP_KEY="B8DC7E53946656EFBCE4C1DD71DAEAAB4AD4CAB6"

BOLD=$'\e[1m'; DIM=$'\e[2m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; RESET=$'\e[0m'
step()  { printf '\n%s==>%s %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$1" "$RESET"; }
info()  { printf '%s    %s%s\n' "$DIM" "$1" "$RESET"; }
warn()  { printf '%s !! %s%s\n' "$YELLOW" "$1" "$RESET"; }
die()   { printf '\n%s !! %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

trap 'die "Failed on line $LINENO. Nothing was rolled back; re-run once the cause is fixed."' ERR

# --- Preflight --------------------------------------------------------------

grep -q 'ID=ubuntu' /etc/os-release || warn "This script targets Ubuntu 24.04. Continuing anyway."

# Running as root works, but it is not what you want on a box that will serve
# traffic: every file the install writes ends up root-owned, Composer refuses to
# run its plugins without being told to, and the application processes you start
# afterwards inherit the habit. A fresh VPS gives you a root shell, so the
# escape hatch exists — it just has to be asked for.
if [[ "$(id -u)" -eq 0 ]]; then
  if [[ "${ALLOW_ROOT:-0}" != "1" ]]; then
    die "Refusing to run as root.

    Create an unprivileged user and run it as them (recommended):

      adduser --disabled-password --gecos '' vitaqueen \\
        && usermod -aG sudo vitaqueen \\
        && install -m 440 /dev/stdin /etc/sudoers.d/vitaqueen <<< 'vitaqueen ALL=(ALL) NOPASSWD:ALL' \\
        && sudo -iu vitaqueen bash -c 'curl -fsSL ${REPO_URL%.git}/raw/${REPO_BRANCH}/infra/scripts/install-ubuntu.sh | bash'

    Then remove the passwordless sudo rule once the install has finished:

      rm /etc/sudoers.d/vitaqueen && passwd vitaqueen

    Or, if you know what you are trading away, re-run with ALLOW_ROOT=1."
  fi

  warn "Running as root (ALLOW_ROOT=1). Everything this writes will be root-owned."
  # Composer bails out under root unless this is set, and silently skips plugins.
  export COMPOSER_ALLOW_SUPERUSER=1
  # Arrays, not strings: an empty array expands to nothing, whereas an empty
  # string leaves the next word to be parsed as the command — which is how
  # `$SUDO -E bash` became a shell looking for a program called `-E`.
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
# Never let a slow mirror turn into an install that appears to have died.
APT_OPTS=(-o "Acquire::http::Timeout=25" -o "Acquire::https::Timeout=25" -o "Acquire::Retries=2")

# --- System packages --------------------------------------------------------

step "Base packages"
"${SUDO[@]}" apt-get "${APT_OPTS[@]}" update -qq
"${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq \
  ca-certificates curl git gnupg unzip openssl lsb-release software-properties-common

# Ubuntu 24.04 ships PHP 8.3; 8.4 comes from Ondřej Surý's archive.
#
# `add-apt-repository` fetches the PPA's signing key through the Launchpad API,
# which returns `500 GPGKeyTemporarilyNotFoundError` during Launchpad
# incidents. That is exactly as temporary as it sounds, so retry — and if the
# API stays down, add the repository by hand using the same key from the Ubuntu
# keyserver, pinned by fingerprint.
add_php_ppa() {
  if compgen -G "/etc/apt/sources.list.d/*ondrej*php*" >/dev/null 2>&1; then
    info "PHP archive already configured."
    return 0
  fi

  # Bounded and noisy on purpose. Left to itself `add-apt-repository` can sit on
  # an unresponsive Launchpad API for minutes with nothing on screen, which is
  # indistinguishable from a hung install.
  local attempt
  for attempt in 1 2 3; do
    info "Asking Launchpad for the PHP archive (attempt ${attempt}/3, 60s limit)…"
    if "${SUDO[@]}" timeout 60 add-apt-repository -y ppa:ondrej/php >/dev/null 2>&1; then
      return 0
    fi
    [[ "$attempt" -lt 3 ]] && sleep 5
  done

  warn "Launchpad is not answering. Adding the archive directly from the keyserver instead."

  local codename keyring tmpkey
  # shellcheck source=/dev/null
  codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  keyring="/etc/apt/keyrings/ondrej-php.gpg"
  tmpkey="$(mktemp)"

  curl -fsSL --retry 3 --retry-delay 3 \
    "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x${ONDREJ_PHP_KEY}" -o "$tmpkey" \
    || die "Could not reach the Ubuntu keyserver either. Check outbound HTTPS and try again."

  # Verify before trusting: a keyserver returns whatever it is given, and the
  # whole point of pinning a fingerprint is to check it.
  gpg --show-keys --with-colons "$tmpkey" 2>/dev/null | grep -q "^fpr:*${ONDREJ_PHP_KEY}:" \
    || { rm -f "$tmpkey"; die "PHP archive key fingerprint mismatch — refusing to trust it."; }

  "${SUDO[@]}" install -d -m 0755 /etc/apt/keyrings
  gpg --dearmor < "$tmpkey" | "${SUDO[@]}" tee "$keyring" >/dev/null
  rm -f "$tmpkey"

  echo "deb [signed-by=${keyring}] https://ppa.launchpadcontent.net/ondrej/php/ubuntu ${codename} main" \
    | "${SUDO[@]}" tee /etc/apt/sources.list.d/ondrej-php.list >/dev/null
}

php_packages() {
  local v="$1"
  printf 'php%s-cli php%s-fpm php%s-mbstring php%s-xml php%s-curl php%s-zip php%s-intl php%s-bcmath php%s-gd php%s-mysql php%s-redis php%s-sqlite3' \
    "$v" "$v" "$v" "$v" "$v" "$v" "$v" "$v" "$v" "$v" "$v" "$v"
}

use_php() {
  PHP_VERSION="$1"
  PHP_BIN="php$1"
  info "$("$PHP_BIN" -v | head -1)"
}

install_php() {
  local v pkgs f

  # Something suitable already present?
  for v in "$PHP_PREFERRED" "$PHP_FALLBACK"; do
    if command -v "php${v}" >/dev/null; then
      use_php "$v"
      return 0
    fi
  done

  info "Installing PHP and its extensions takes a couple of minutes."

  # First choice: 8.4 from Ondřej Surý's archive.
  read -r -a pkgs <<< "$(php_packages "$PHP_PREFERRED")"
  if add_php_ppa \
    && "${SUDO[@]}" apt-get "${APT_OPTS[@]}" update -qq 2>/dev/null \
    && "${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq "${pkgs[@]}" 2>/dev/null; then
    use_php "$PHP_PREFERRED"
    return 0
  fi

  # Launchpad is unreachable often enough — a 500 from its key API, a stalled
  # TLS handshake to ppa.launchpadcontent.net — that treating it as a hard
  # dependency would strand installs over a version this project does not
  # actually require.
  warn "PHP ${PHP_PREFERRED} is not reachable (Launchpad). Falling back to Ubuntu's PHP ${PHP_FALLBACK}, which satisfies composer.json's ^8.3."

  # Park the unusable source rather than deleting it: `apt-get update` stops
  # failing, and the change is obvious and reversible.
  for f in /etc/apt/sources.list.d/*ondrej*php*; do
    [[ -e "$f" ]] || continue
    "${SUDO[@]}" mv "$f" "${f}.disabled"
    warn "Disabled ${f} — rename it back once Launchpad is reachable again."
  done

  read -r -a pkgs <<< "$(php_packages "$PHP_FALLBACK")"
  "${SUDO[@]}" apt-get "${APT_OPTS[@]}" update -qq
  "${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq "${pkgs[@]}"
  use_php "$PHP_FALLBACK"
}

step "PHP"
install_php

step "Composer"
if ! command -v composer >/dev/null; then
  EXPECTED="$(curl -fsSL https://composer.github.io/installer.sig)"
  curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
  ACTUAL="$("$PHP_BIN" -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
  # The installer is fetched over the network and then run as PHP. Verifying it
  # against the published signature is the whole reason this is four lines.
  [[ "$EXPECTED" == "$ACTUAL" ]] || die "Composer installer checksum mismatch — refusing to run it."
  "${SUDO[@]}" "$PHP_BIN" /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
fi
info "$("$PHP_BIN" "$(command -v composer)" --version 2>/dev/null)"

step "Node ${NODE_MAJOR}"
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | "${SUDO_E[@]}" bash - >/dev/null
  "${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq nodejs
fi
info "node $(node -v), npm $(npm -v)"

step "MySQL and Redis"
info "MySQL is the slowest package here; give it a minute."
"${SUDO[@]}" apt-get "${APT_OPTS[@]}" install -y -qq mysql-server redis-server
"${SUDO[@]}" systemctl enable --now mysql redis-server >/dev/null 2>&1 || true

# --- Database ---------------------------------------------------------------

step "Database"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
if "${SUDO[@]}" mysql -N -e "SELECT 1 FROM mysql.user WHERE user='${DB_USER}'" | grep -q 1; then
  info "User ${DB_USER} already exists; leaving its password alone."
  DB_PASSWORD=""
else
  # Grants are limited to this one schema. The application never connects as root.
  "${SUDO[@]}" mysql <<SQL
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
info "Installing PHP dependencies."
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
info "Installing front-end dependencies (~450 packages)."
npm ci --no-audit --no-fund --no-progress

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

  ${BOLD}Running PHP ${PHP_VERSION}${RESET}

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
