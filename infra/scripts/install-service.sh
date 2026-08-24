#!/usr/bin/env bash
#
# Install VitaQueen as systemd services, so the site does not belong to an SSH
# session.
#
#   sudo bash infra/scripts/install-service.sh            # front end
#   sudo bash infra/scripts/install-service.sh --with-api # front end + API
#
# Idempotent: re-running rewrites the units with current paths and restarts.

set -euo pipefail

BOLD=$'\033[1m'
DIM=$'\033[2m'
RED=$'\033[31m'
YELLOW=$'\033[33m'
RESET=$'\033[0m'

info() { printf '%s\n' "$*"; }
warn() { printf '%s%s%s\n' "$YELLOW" "$*" "$RESET" >&2; }
die() { printf '%s%s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

WITH_API=0
for arg in "$@"; do
  case "$arg" in
    --with-api) WITH_API=1 ;;
    -h | --help) sed -n '2,10p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) die "Unknown option: ${arg}" ;;
  esac
done

(( EUID == 0 )) || die "Run this with sudo: sudo bash ${BASH_SOURCE[0]} ${*:-}"

[[ -d /run/systemd/system ]] || die "This machine is not running systemd; there is nothing here to install into."

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
units="${root}/infra/systemd"

# The services run as whoever owns the checkout, not as root: the build output,
# node_modules and both .env files are theirs.
owner="$(stat -c '%U' "$root")"
group="$(stat -c '%G' "$root")"
[[ "$owner" != "root" ]] || warn "The checkout is owned by root. The services will run as root, which the installer went out of its way to avoid."

[[ -d "${root}/apps/web/.next" ]] || die "No production build at apps/web/.next — run 'npm run build' in apps/web first."

# Resolve the interpreters as the owner sees them: nvm, asdf and /opt installs
# are all invisible to root's PATH.
node_bin="$(sudo -u "$owner" -H bash -lc 'command -v node' 2>/dev/null || true)"
[[ -n "$node_bin" ]] || node_bin="$(command -v node || true)"
[[ -n "$node_bin" ]] || die "node not found. Install Node 22 or run infra/scripts/install-ubuntu.sh."

php_bin="$(sudo -u "$owner" -H bash -lc 'command -v php8.4 || command -v php8.3 || command -v php' 2>/dev/null || true)"
[[ -n "$php_bin" ]] || php_bin="$(command -v php || true)"

install_unit() {
  local name="$1" php="${2:-}"
  local src="${units}/${name}" dest="/etc/systemd/system/${name}"

  [[ -f "$src" ]] || die "Missing unit template: ${src}"

  sed \
    -e "s|__USER__|${owner}|g" \
    -e "s|__GROUP__|${group}|g" \
    -e "s|__DIR__|${root}|g" \
    -e "s|__NODE__|${node_bin}|g" \
    -e "s|__PHP__|${php}|g" \
    "$src" > "$dest"

  chmod 644 "$dest"
  info "  ${dest}"
}

info "${BOLD}Installing units${RESET} ${DIM}(user ${owner}, checkout ${root})${RESET}"
install_unit vitaqueen-web.service

if (( WITH_API )); then
  [[ -n "$php_bin" ]] || die "php not found, so the API unit cannot be installed."
  install_unit vitaqueen-api.service "$php_bin"
fi

systemctl daemon-reload

services=(vitaqueen-web.service)
(( WITH_API )) && services+=(vitaqueen-api.service)

systemctl enable --now "${services[@]}"

# `enable --now` returns before the server has finished binding its port.
sleep 2

failed=0
for service in "${services[@]}"; do
  if systemctl is-active --quiet "$service"; then
    info "  ${service}: active"
  else
    warn "  ${service}: NOT running"
    failed=1
  fi
done

echo
if (( failed )); then
  warn "Something did not start. The reason is in the log:"
  echo "  journalctl -u vitaqueen-web -n 50 --no-pager"
  exit 1
fi

cat <<EOF
${BOLD}The site now survives logout, reboot and its own crashes.${RESET}

  ${DIM}status  ${RESET}systemctl status vitaqueen-web
  ${DIM}logs    ${RESET}journalctl -u vitaqueen-web -f
  ${DIM}restart ${RESET}sudo systemctl restart vitaqueen-web
  ${DIM}stop    ${RESET}sudo systemctl stop vitaqueen-web

After a deploy — git pull, npm run build — restart it:

  sudo systemctl restart vitaqueen-web

Settings live in /etc/default/vitaqueen-web (PORT, HOSTNAME). Once nginx is in
front, put HOSTNAME=127.0.0.1 there so the origin stops answering the internet
directly.
EOF
