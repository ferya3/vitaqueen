#!/usr/bin/env bash
#
# Installed as /etc/letsencrypt/renewal-hooks/deploy/mail-reload.
#
# Postfix and Dovecot both read the certificate once, at start-up. A renewal
# that nobody reloads is a certificate that expires on disk while a valid one
# sits beside it — and the first symptom is a staff member unable to send from
# their phone, sixty days after the renewal "succeeded".
set -Eeuo pipefail

for unit in postfix dovecot nginx; do
  systemctl is-active --quiet "$unit" || continue
  systemctl reload "$unit" || systemctl restart "$unit" || true
  logger -t certbot-deploy "reloaded $unit after certificate renewal"
done
