# Rspamd must resolve DNS through a local validating resolver, not a public one.
# Spamhaus and most other blocklists refuse queries that arrive from 8.8.8.8 or
# 1.1.1.1 — the answer comes back as "listed", every message scores as spam, and
# nothing in the logs says why. install-mail.sh puts unbound on 127.0.0.1 for
# exactly this reason.
dns {
  nameserver = ["127.0.0.1:53"];
  timeout = 1s;
  sockets = 16;
  retransmits = 5;
}
