#!/usr/bin/env bash
#
# VitaQueen — mail server installer for Ubuntu 24.04 LTS and Debian 12.
#
#   cp mail.env.example mail.env && $EDITOR mail.env
#   sudo ./install-mail.sh
#
# Builds the architecture in docs/email.md: Postfix, Dovecot, Rspamd, Redis,
# ClamAV, unbound, fail2ban, Let's Encrypt, and optionally Roundcube.
#
# Idempotent. Re-running never overwrites a DKIM key, a mailbox, a password or
# mail.env; any configuration file it replaces is copied aside first.
#
# It runs in two passes on a fresh machine, because certificates cannot be
# issued for names that do not resolve yet:
#
#   1. First run — installs packages, generates the DKIM keys, prints every DNS
#      record you need, and stops.
#   2. Publish those records. Set the PTR record at your hosting provider.
#   3. Second run — issues certificates, renders the configuration, creates the
#      first mailbox, starts everything.
#
# What it does NOT do: it does not decide your hosting, your IP reputation or
# your DNS. Those are the parts that determine whether mail is delivered — see
# "Where it runs" in docs/email.md.

set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_SRC="${MAIL_ENV:-$HERE/mail.env}"
ENV_DEST=/etc/vitaqueen-mail.env
STAMP="$(date -u +%Y%m%d%H%M%S)"

BOLD=$'\e[1m'; DIM=$'\e[2m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; RESET=$'\e[0m'
step() { printf '\n%s==>%s %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$1" "$RESET"; }
info() { printf '%s    %s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '%s !! %s%s\n' "$YELLOW" "$1" "$RESET"; }
die()  { printf '\n%s !! %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

trap 'die "Failed on line $LINENO. Nothing was rolled back; re-run once the cause is fixed — this script is idempotent."' ERR

# --- Preflight --------------------------------------------------------------

[[ "$(id -u)" -eq 0 ]] || die "Run as root. A mail server is system services, system users and /etc — sudo ./install-mail.sh"

if ! grep -qE 'ID=(ubuntu|debian)' /etc/os-release; then
  warn "This targets Ubuntu 24.04 and Debian 12. Continuing anyway; package names may differ."
fi

[[ -r "$ENV_SRC" ]] || die "No mail.env.

    cp $HERE/mail.env.example $HERE/mail.env
    \$EDITOR $HERE/mail.env

  Then run this again."

# shellcheck disable=SC1090
source "$ENV_SRC"

: "${MAIL_DOMAIN:?MAIL_DOMAIN is not set in mail.env}"
: "${MAIL_HOSTNAME:?MAIL_HOSTNAME is not set in mail.env}"
: "${PRIMARY_USER:?PRIMARY_USER is not set in mail.env}"

[[ "$MAIL_DOMAIN" == "example.com" ]] && die "MAIL_DOMAIN is still example.com. Edit mail.env first."
[[ "$MAIL_HOSTNAME" == *".$MAIL_DOMAIN" ]] || warn "$MAIL_HOSTNAME is not a subdomain of $MAIL_DOMAIN. That works, but it is unusual — check it is what you meant."

BOUNCE_SUBDOMAIN="${BOUNCE_SUBDOMAIN:-bounce}"
BOUNCE_DOMAIN="$BOUNCE_SUBDOMAIN.$MAIL_DOMAIN"
APP_PLANE="${APP_PLANE:-yes}"
WEBMAIL="${WEBMAIL:-yes}"
QUOTA="${QUOTA:-5G}"
INET_PROTOCOLS="${INET_PROTOCOLS:-ipv4}"
TRUSTED_CIDRS="${TRUSTED_CIDRS:-}"
CERTBOT_MODE="${CERTBOT_MODE:-standalone}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-postmaster@$MAIL_DOMAIN}"
MESSAGE_SIZE_LIMIT="${MESSAGE_SIZE_LIMIT:-52428800}"
DKIM_KEY_BITS="${DKIM_KEY_BITS:-2048}"
ROLE_ALIASES="${ROLE_ALIASES:-}"
RETENTION_MAILBOXES="${RETENTION_MAILBOXES:-}"
RETENTION_DAYS="${RETENTION_DAYS:-365}"
# testing first: TLS-RPT reports arrive, but a broken policy cannot stop mail.
# Move to enforce by hand once the reports are clean — see docs/email.md.
STS_MODE="${STS_MODE:-testing}"

info "Domain:     $MAIL_DOMAIN"
info "Host:       $MAIL_HOSTNAME"
info "Bounce:     $BOUNCE_DOMAIN$( [[ "$APP_PLANE" == yes ]] || printf ' (disabled)' )"
info "Webmail:    $WEBMAIL"

# --- Packages ---------------------------------------------------------------

step "Packages"

export DEBIAN_FRONTEND=noninteractive
# Postfix asks two questions at install time and blocks forever if nobody
# answers them. Answer them first.
debconf-set-selections <<< "postfix postfix/main_mailer_type select Internet Site"
debconf-set-selections <<< "postfix postfix/mailname string $MAIL_DOMAIN"

# Roundcube's packaging asks the same kind of question. SQLite keeps a database
# server off the mail host entirely — webmail state is a few hundred rows.
if [[ "${WEBMAIL:-yes}" == "yes" ]]; then
  debconf-set-selections <<< "roundcube-core roundcube/dbconfig-install boolean true"
  debconf-set-selections <<< "roundcube-core roundcube/database-type select sqlite3"
fi

PACKAGES=(
  postfix postfix-pcre
  dovecot-core dovecot-imapd dovecot-lmtpd dovecot-managesieved dovecot-sieve
  rspamd redis-server
  unbound                       # local validating resolver — see rspamd/options.inc
  clamav-daemon clamav-freshclam
  certbot fail2ban rsyslog
  dnsutils curl openssl ca-certificates swaks restic
)

[[ "$CERTBOT_MODE" == "dns-cloudflare" ]] && PACKAGES+=(python3-certbot-dns-cloudflare)

apt-get update -qq
apt-get install -y -qq "${PACKAGES[@]}"
info "Installed $(printf '%s ' "${PACKAGES[@]}" | wc -w) packages."

# Webmail is a convenience; mail is not. Installing it separately means a
# roundcube package missing from this release cannot fail the whole run and
# leave the machine with no mail server at all.
if [[ "$WEBMAIL" == "yes" ]]; then
  if apt-get install -y -qq nginx roundcube-core roundcube-sqlite3 roundcube-plugins php-fpm; then
    info "Webmail packages installed."
  else
    warn "Roundcube or nginx would not install; continuing without webmail. IMAP and submission are unaffected."
    WEBMAIL=no
  fi
fi

# Outbound MTA-STS: lets this server honour the TLS policies its recipients
# publish. Optional because it is not in every archive, and mail still flows
# without it — it just cannot discover a policy on its own.
MTA_STS_RESOLVER=no
if apt-get install -y -qq postfix-mta-sts-resolver 2>/dev/null; then
  MTA_STS_RESOLVER=yes
  info "postfix-mta-sts-resolver installed: outbound MTA-STS policies will be honoured."
else
  warn "postfix-mta-sts-resolver is unavailable; outbound TLS stays opportunistic."
fi

# --- The vmail user ---------------------------------------------------------

step "Mail storage"

if ! id vmail >/dev/null 2>&1; then
  groupadd -g 5000 vmail
  useradd -r -u 5000 -g vmail -d /var/vmail -s /usr/sbin/nologin -c "Virtual mail" vmail
  info "Created the vmail system user (uid 5000)."
fi
install -d -o vmail -g vmail -m 750 /var/vmail
printf '%s\n' "$MAIL_DOMAIN" > /etc/mailname
hostnamectl set-hostname "$MAIL_HOSTNAME" 2>/dev/null || warn "Could not set the system hostname; set it by hand to $MAIL_HOSTNAME."

# --- DKIM keys --------------------------------------------------------------

step "DKIM keys"

install -d -o _rspamd -g _rspamd -m 750 /var/lib/rspamd/dkim

generate_dkim() {
  local domain="$1" selector="$2"
  local key="/var/lib/rspamd/dkim/$domain.$selector.key"

  if [[ -f "$key" ]]; then
    info "$domain selector '$selector' already exists — left alone."
    return
  fi

  rspamadm dkim_keygen -s "$selector" -d "$domain" -b "$DKIM_KEY_BITS" -k "$key" > "$key.pub"
  chown _rspamd:_rspamd "$key" "$key.pub"
  chmod 400 "$key"
  chmod 444 "$key.pub"
  info "Generated $DKIM_KEY_BITS-bit key for $domain, selector '$selector'."
}

generate_dkim "$MAIL_DOMAIN" mail
[[ "$APP_PLANE" == yes ]] && generate_dkim "$BOUNCE_DOMAIN" app

# --- Resolved environment ---------------------------------------------------
# Written before the DNS gate below, so bin/dns-records works on the first run.

PASSWORD_SCHEME=BLF-CRYPT
if doveadm pw -l 2>/dev/null | tr ' ' '\n' | grep -qx "ARGON2ID"; then
  PASSWORD_SCHEME=ARGON2ID
else
  warn "This Dovecot has no ARGON2ID scheme; falling back to BLF-CRYPT. Both are sound; Argon2id is the one the rest of this project uses."
fi

cat > "$ENV_DEST" <<ENV
# Resolved configuration, written by install-mail.sh on $(date -u +%F). Read by
# mailbox, dns-records, mail-check, mail-expunge and mail-backup.
MAIL_DOMAIN=$MAIL_DOMAIN
MAIL_HOSTNAME=$MAIL_HOSTNAME
BOUNCE_DOMAIN=$BOUNCE_DOMAIN
APP_PLANE=$APP_PLANE
PASSWORD_SCHEME=$PASSWORD_SCHEME
QUOTA=$QUOTA
RETENTION_MAILBOXES="$RETENTION_MAILBOXES"
RETENTION_DAYS=$RETENTION_DAYS
ENV
chmod 600 "$ENV_DEST"

install -m 750 "$HERE/bin/mailbox" "$HERE/bin/dns-records" "$HERE/bin/mail-check" \
               "$HERE/bin/mail-expunge" "$HERE/bin/mail-backup" /usr/local/sbin/
info "Installed mailbox, dns-records, mail-check, mail-expunge, mail-backup to /usr/local/sbin."

# --- The DNS gate -----------------------------------------------------------
# Certificates cannot be issued for a name that does not resolve, and there is
# no point starting a mail server that nothing can find. Stop here, print the
# records, and let the second run finish the job.

step "DNS"

if ! getent hosts "$MAIL_HOSTNAME" >/dev/null 2>&1; then
  /usr/local/sbin/dns-records || true
  cat <<GATE

  ${BOLD}Stopping here — on purpose.${RESET}

  ${MAIL_HOSTNAME} does not resolve yet, so no certificate can be issued for
  it. Publish the records above, set the PTR record with your hosting
  provider, wait for the TTL, and run this script again:

    sudo $0

  Nothing done so far is lost: the DKIM keys are generated and will not be
  regenerated, so the records above stay valid.

GATE
  exit 0
fi
info "$MAIL_HOSTNAME resolves. Continuing."

# --- Certificates -----------------------------------------------------------

step "TLS certificate"

CERT_NAMES=("$MAIL_HOSTNAME")
for extra in "mta-sts.$MAIL_DOMAIN" "webmail.$MAIL_DOMAIN" "autoconfig.$MAIL_DOMAIN" "autodiscover.$MAIL_DOMAIN"; do
  [[ "$WEBMAIL" != yes && "$extra" == "webmail.$MAIL_DOMAIN" ]] && continue
  if getent hosts "$extra" >/dev/null 2>&1; then
    CERT_NAMES+=("$extra")
  else
    warn "$extra does not resolve — leaving it out of the certificate. Add the record and re-run to include it."
  fi
done

CERT_DIR="/etc/letsencrypt/live/$MAIL_HOSTNAME"
CERT_ARGS=(certonly --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL"
           --cert-name "$MAIL_HOSTNAME" --keep-until-expiring)
for name in "${CERT_NAMES[@]}"; do CERT_ARGS+=(-d "$name"); done

case "$CERTBOT_MODE" in
  dns-cloudflare)
    [[ -r "${CF_API_TOKEN_FILE:-}" ]] || die "CERTBOT_MODE=dns-cloudflare but CF_API_TOKEN_FILE is not readable: ${CF_API_TOKEN_FILE:-unset}"
    chmod 600 "$CF_API_TOKEN_FILE"
    CERT_ARGS+=(--dns-cloudflare --dns-cloudflare-credentials "$CF_API_TOKEN_FILE" --dns-cloudflare-propagation-seconds 30)
    ;;
  standalone)
    # nginx would hold port 80. Give it back for the length of the challenge.
    CERT_ARGS+=(--standalone --pre-hook "systemctl stop nginx 2>/dev/null || true"
                --post-hook "systemctl start nginx 2>/dev/null || true")
    ;;
  *)
    die "CERTBOT_MODE must be 'standalone' or 'dns-cloudflare', not '$CERTBOT_MODE'."
    ;;
esac

certbot "${CERT_ARGS[@]}"
[[ -r "$CERT_DIR/fullchain.pem" ]] || die "certbot reported success but $CERT_DIR/fullchain.pem is not there."
info "Certificate covers: ${CERT_NAMES[*]}"

install -d /etc/letsencrypt/renewal-hooks/deploy
install -m 755 "$HERE/certbot/deploy-hook.sh" /etc/letsencrypt/renewal-hooks/deploy/mail-reload
info "Renewal hook installed: Postfix, Dovecot and nginx reload on every renewal."

# Dovecot reads the key as root at start-up, but the group needs traversal for
# anything else that has to check it.
chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive

# --- Rendering --------------------------------------------------------------

step "Configuration"

RSPAMD_PASSWORD="$(openssl rand -hex 12)"
RSPAMD_PW_HASH="$(rspamadm pw -p "$RSPAMD_PASSWORD" 2>/dev/null || printf '')"
[[ -z "$RSPAMD_PW_HASH" ]] && warn "Could not hash the Rspamd controller password; the web UI will stay unconfigured."

ROUNDCUBE_ROOT=""
PHP_FPM_SOCKET=""
if [[ "$WEBMAIL" == yes ]]; then
  for candidate in /var/lib/roundcube/public_html /var/lib/roundcube /usr/share/roundcube; do
    [[ -f "$candidate/index.php" ]] && { ROUNDCUBE_ROOT="$candidate"; break; }
  done
  [[ -n "$ROUNDCUBE_ROOT" ]] || warn "Roundcube's document root was not found; the webmail vhost will not be installed."
  PHP_FPM_SOCKET="$(find /run/php -name 'php*-fpm.sock' -print -quit 2>/dev/null || true)"
  [[ -n "$PHP_FPM_SOCKET" ]] || warn "No PHP-FPM socket found under /run/php; the webmail vhost will not be installed."
  [[ -z "$ROUNDCUBE_ROOT" || -z "$PHP_FPM_SOCKET" ]] && WEBMAIL=no
fi

sed_escape() { printf '%s' "$1" | sed -e 's/[&|\\]/\\&/g'; }

render() {
  local src="$1" dest="$2"

  # Replace a config file only once per change, and keep what was there. A
  # server rebuilt on a bad afternoon should still have yesterday's working
  # file next to today's.
  if [[ -f "$dest" ]] && ! cmp -s <(render_to_stdout "$src") "$dest"; then
    cp -a "$dest" "$dest.bak.$STAMP"
    info "Kept the previous $dest as $(basename "$dest").bak.$STAMP"
  fi
  render_to_stdout "$src" > "$dest"
}

render_to_stdout() {
  sed -e "s|__MAIL_DOMAIN__|$(sed_escape "$MAIL_DOMAIN")|g" \
      -e "s|__MAIL_HOSTNAME__|$(sed_escape "$MAIL_HOSTNAME")|g" \
      -e "s|__BOUNCE_DOMAIN__|$(sed_escape "$BOUNCE_DOMAIN")|g" \
      -e "s|__INET_PROTOCOLS__|$(sed_escape "$INET_PROTOCOLS")|g" \
      -e "s|__MESSAGE_SIZE_LIMIT__|$(sed_escape "$MESSAGE_SIZE_LIMIT")|g" \
      -e "s|__QUOTA__|$(sed_escape "$QUOTA")|g" \
      -e "s|__PASSWORD_SCHEME__|$(sed_escape "$PASSWORD_SCHEME")|g" \
      -e "s|__RSPAMD_CONTROLLER_PASSWORD__|$(sed_escape "$RSPAMD_PW_HASH")|g" \
      -e "s|__TRUSTED_CIDRS__|$(sed_escape "$TRUSTED_CIDRS")|g" \
      -e "s|__ROUNDCUBE_ROOT__|$(sed_escape "$ROUNDCUBE_ROOT")|g" \
      -e "s|__PHP_FPM_SOCKET__|$(sed_escape "$PHP_FPM_SOCKET")|g" \
      -e "s|__STS_MODE__|$(sed_escape "$STS_MODE")|g" \
      "$1"
}

render "$HERE/postfix/main.cf" /etc/postfix/main.cf
render "$HERE/postfix/master.cf" /etc/postfix/master.cf
render "$HERE/postfix/submission_header_checks" /etc/postfix/submission_header_checks
[[ -f /etc/postfix/tls_policy ]] || render "$HERE/postfix/tls_policy" /etc/postfix/tls_policy

if [[ "$MTA_STS_RESOLVER" != yes ]]; then
  # Without the resolver, the socketmap would be an unreachable lookup table
  # and every outbound delivery would defer.
  sed -i 's|^smtp_tls_policy_maps = socketmap.*|smtp_tls_policy_maps = hash:/etc/postfix/tls_policy|' /etc/postfix/main.cf
fi

render "$HERE/dovecot/local.conf" /etc/dovecot/local.conf

# Debian's dovecot ships a PAM passdb and a passwd userdb, and conf.d is
# included before local.conf — so they sit *ahead* of ours in the lookup order.
# Left alone, every system account on this box can log into IMAP with its shell
# password, and a virtual address that collides with a Unix name resolves to
# the wrong home directory. local.conf cannot remove an earlier passdb; the
# include has to go.
AUTH_SYSTEM=/etc/dovecot/conf.d/10-auth.conf
if grep -qE '^[[:space:]]*!include auth-system\.conf\.ext' "$AUTH_SYSTEM" 2>/dev/null; then
  cp -a "$AUTH_SYSTEM" "$AUTH_SYSTEM.bak.$STAMP"
  sed -i 's|^\([[:space:]]*\)!include auth-system\.conf\.ext|\1#!include auth-system.conf.ext  # disabled by install-mail.sh: virtual users only|' "$AUTH_SYSTEM"
  info "Disabled Dovecot's system-user authentication; only the virtual mailboxes can log in."
fi
install -d /etc/dovecot/sieve/after.d
render "$HERE/dovecot/sieve/spam-to-junk.sieve" /etc/dovecot/sieve/after.d/spam-to-junk.sieve
sievec /etc/dovecot/sieve/after.d 2>/dev/null || warn "sievec failed; the spam-to-Junk rule will not run until it compiles."

if doveconf -n 2>/dev/null | grep -q 'driver = pam'; then
  warn "Dovecot still has a PAM passdb configured. Check /etc/dovecot/conf.d/10-auth.conf — system accounts must not be able to log in."
fi

install -d /etc/rspamd/local.d
for file in "$HERE"/rspamd/local.d/*; do
  render "$file" "/etc/rspamd/local.d/$(basename "$file")"
done

render "$HERE/fail2ban/jail.d/mail.conf" /etc/fail2ban/jail.d/mail.conf
install -m 644 "$HERE/logrotate/mail" /etc/logrotate.d/vitaqueen-mail

install -d /var/www/mta-sts
render "$HERE/autoconfig/mta-sts.txt" /var/www/mta-sts/mta-sts.txt
install -d /var/www/mail-autoconfig
render "$HERE/autoconfig/config-v1.1.xml" /var/www/mail-autoconfig/config-v1.1.xml
render "$HERE/autoconfig/autodiscover.xml" /var/www/mail-autoconfig/autodiscover.xml

for unit in "$HERE"/systemd/*; do
  install -m 644 "$unit" "/etc/systemd/system/$(basename "$unit")"
done
systemctl daemon-reload

info "Rendered Postfix, Dovecot, Rspamd, fail2ban, autoconfig and the MTA-STS policy."

# --- Maps and accounts ------------------------------------------------------

step "Accounts"

for map in /etc/postfix/vmailbox /etc/postfix/virtual_alias /etc/postfix/sender_login; do
  [[ -f "$map" ]] || printf '%s\n' "# Maintained by the mailbox command. Run postmap after editing by hand." > "$map"
done
touch /etc/dovecot/users
chmod 640 /etc/dovecot/users
chown root:dovecot /etc/dovecot/users
postmap /etc/postfix/vmailbox /etc/postfix/virtual_alias /etc/postfix/sender_login /etc/postfix/tls_policy

# Postfix has to be able to start before `mailbox` can reload it.
systemctl restart postfix
systemctl restart dovecot

PRIMARY_ADDRESS="$PRIMARY_USER@$MAIL_DOMAIN"
PRIMARY_CREATED=no
if ! grep -q "^${PRIMARY_ADDRESS//./\\.}:" /etc/dovecot/users; then
  /usr/local/sbin/mailbox add "$PRIMARY_ADDRESS"
  PRIMARY_CREATED=yes
else
  info "$PRIMARY_ADDRESS already exists — left alone."
fi

# postmaster and abuse are required by RFC 2142; the rest are this
# architecture's own plumbing. All of them land in the primary mailbox until
# somebody decides otherwise.
for role in postmaster abuse dmarc tlsrpt noreply $ROLE_ALIASES; do
  grep -q "^${role//./\\.}@${MAIL_DOMAIN//./\\.}[[:space:]]" /etc/postfix/virtual_alias && continue
  /usr/local/sbin/mailbox alias "$role@$MAIL_DOMAIN" "$PRIMARY_ADDRESS" >/dev/null
done
info "Aliases: postmaster, abuse, dmarc, tlsrpt, noreply${ROLE_ALIASES:+, $ROLE_ALIASES} → $PRIMARY_ADDRESS"

APP_ADDRESS="app@$MAIL_DOMAIN"
APP_CREATED=no
if [[ "$APP_PLANE" == yes ]] && ! grep -q "^${APP_ADDRESS//./\\.}:" /etc/dovecot/users; then
  /usr/local/sbin/mailbox add "$APP_ADDRESS"
  APP_CREATED=yes
  # The whole point of the application plane: this credential may send as
  # noreply@ and as the bounce address, and as nothing else.
  /usr/local/sbin/mailbox sender "noreply@$MAIL_DOMAIN" "$APP_ADDRESS" >/dev/null
  /usr/local/sbin/mailbox sender "bounces@$BOUNCE_DOMAIN" "$APP_ADDRESS" >/dev/null
  /usr/local/sbin/mailbox alias "bounces@$BOUNCE_DOMAIN" "$APP_ADDRESS" >/dev/null
  info "Application account created and locked to noreply@$MAIL_DOMAIN and bounces@$BOUNCE_DOMAIN."
fi

# --- Webmail ----------------------------------------------------------------

if [[ "$WEBMAIL" == yes ]]; then
  step "Webmail"

  render "$HERE/nginx/mail-host.conf" /etc/nginx/sites-available/mail.conf
  ln -sf /etc/nginx/sites-available/mail.conf /etc/nginx/sites-enabled/mail.conf
  rm -f /etc/nginx/sites-enabled/default

  RC_CONFIG=/etc/roundcube/config.inc.php
  if [[ -f "$RC_CONFIG" ]] && ! grep -q 'vitaqueen-mail' "$RC_CONFIG"; then
    cat >> "$RC_CONFIG" <<RCCONF

// --- vitaqueen-mail ---------------------------------------------------------
// Roundcube talks to Dovecot and Postfix over TLS on the loopback-facing
// hostname rather than to localhost, so the certificate name matches and the
// connection is verified rather than merely encrypted.
\$config['imap_host'] = 'ssl://$MAIL_HOSTNAME:993';
\$config['smtp_host'] = 'ssl://$MAIL_HOSTNAME:465';
\$config['smtp_user'] = '%u';
\$config['smtp_pass'] = '%p';
\$config['product_name'] = '$MAIL_DOMAIN webmail';
\$config['login_lc'] = 2;
\$config['des_key'] = '$(openssl rand -base64 24)';
RCCONF
    info "Configured Roundcube against $MAIL_HOSTNAME."
  fi

  if nginx -t 2>/dev/null; then
    systemctl reload nginx
  else
    warn "nginx refused the configuration; webmail is not serving. Run: nginx -t"
  fi
fi

# --- Services ---------------------------------------------------------------

step "Services"

systemctl enable --now unbound redis-server >/dev/null 2>&1 || warn "unbound or redis did not start."

# ClamAV cannot start until freshclam has downloaded a signature database,
# which takes a few minutes on a fresh machine. Mail flows without it; the
# antivirus module simply finds nothing to talk to and says so in the log.
systemctl enable --now clamav-freshclam >/dev/null 2>&1 || true
if ! systemctl start clamav-daemon 2>/dev/null; then
  warn "clamav-daemon is not up yet — it is waiting for freshclam's first database. It will start on its own."
fi

systemctl enable --now rspamd fail2ban >/dev/null 2>&1 || warn "rspamd or fail2ban did not start."
systemctl restart postfix dovecot rspamd
systemctl enable postfix dovecot >/dev/null 2>&1 || true

if [[ -r /etc/vitaqueen-mail-backup.env ]]; then
  systemctl enable --now vitaqueen-mail-backup.timer >/dev/null 2>&1 || true
  info "Nightly backup timer enabled."
else
  # Enabling it now would mean a unit that fails every night, and a failing
  # unit nobody can fix is a failing unit everybody stops reading.
  systemctl disable --now vitaqueen-mail-backup.timer >/dev/null 2>&1 || true
fi
if [[ -n "$RETENTION_MAILBOXES" ]]; then
  systemctl enable --now vitaqueen-mail-expunge.timer >/dev/null 2>&1 || true
  info "Retention sweep enabled for: $RETENTION_MAILBOXES (older than $RETENTION_DAYS days)."
else
  systemctl disable --now vitaqueen-mail-expunge.timer >/dev/null 2>&1 || true
fi

# --- Firewall ---------------------------------------------------------------

step "Firewall"

if command -v ufw >/dev/null; then
  ufw allow 22/tcp  >/dev/null 2>&1 || true
  for port in 25 80 443 465 587 993; do ufw allow "$port/tcp" >/dev/null 2>&1 || true; done
  if ufw status | grep -q '^Status: active'; then
    info "ufw is active; 22, 25, 80, 443, 465, 587 and 993 are allowed."
  else
    warn "ufw is installed but inactive. Enable it deliberately — after checking 22 is allowed, or you will lock yourself out:  ufw enable"
  fi
  # ManageSieve is not in the list on purpose: server-side rules are rarely
  # needed and there is no reason to expose another authenticated service.
  [[ -n "$TRUSTED_CIDRS" ]] && for cidr in $TRUSTED_CIDRS; do
    ufw allow from "$cidr" to any port 4190 proto tcp >/dev/null 2>&1 || true
  done
else
  warn "No ufw. Open 22, 25, 80, 443, 465, 587, 993 and close everything else in whatever firewall you do have."
fi

# --- Done -------------------------------------------------------------------

step "Done"

cat <<SUMMARY

  ${BOLD}Publish these DNS records${RESET}
    dns-records            ${DIM}# table, for a DNS panel${RESET}
    dns-records --zone     ${DIM}# BIND fragment${RESET}

  ${BOLD}Then verify — all of it, not the parts that are convenient${RESET}
    mail-check

  ${BOLD}Day-to-day${RESET}
    mailbox add you@$MAIL_DOMAIN
    mailbox list
    mailbox alias sales@$MAIL_DOMAIN you@$MAIL_DOMAIN

SUMMARY

if [[ "$WEBMAIL" == yes ]]; then
  printf '  %sWebmail%s  https://webmail.%s\n\n' "$BOLD" "$RESET" "$MAIL_DOMAIN"
fi

if [[ -n "$RSPAMD_PW_HASH" ]]; then
  printf '  %sRspamd web UI%s  ssh -L 11334:127.0.0.1:11334 %s  →  http://127.0.0.1:11334\n' "$BOLD" "$RESET" "$MAIL_HOSTNAME"
  printf '    password: %s%s%s  %s(printed once)%s\n\n' "$BOLD" "$RSPAMD_PASSWORD" "$RESET" "$DIM" "$RESET"
fi

if [[ "$APP_CREATED" == yes ]]; then
  cat <<APPNOTE
  ${BOLD}For apps/api/.env${RESET}
    MAIL_MAILER=smtp
    MAIL_SCHEME=smtps
    MAIL_HOST=$MAIL_HOSTNAME
    MAIL_PORT=465
    MAIL_USERNAME=$APP_ADDRESS
    MAIL_PASSWORD=${DIM}<the app@ password printed above>${RESET}
    MAIL_FROM_ADDRESS=noreply@$MAIL_DOMAIN

  ${DIM}And a queue worker, or the notifications sit in Redis for ever.${RESET}

APPNOTE
fi

if [[ ! -r /etc/vitaqueen-mail-backup.env ]]; then
  warn "No backups yet. Write /etc/vitaqueen-mail-backup.env (see the header of mail-backup), then: systemctl enable --now vitaqueen-mail-backup.timer"
fi
if [[ "$PRIMARY_CREATED" == yes ]]; then
  warn "The mailbox passwords above were printed once. They are stored only as hashes."
fi
info "MTA-STS is in '$STS_MODE' mode. Move it to 'enforce' once TLS-RPT reports are clean: edit /var/www/mta-sts/mta-sts.txt, then change the id= in the _mta-sts TXT record."
