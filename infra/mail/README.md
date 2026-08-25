# infra/mail

The mail server from [docs/email.md](../../docs/email.md), as files you can
run. Postfix, Dovecot, Rspamd, Redis, ClamAV, unbound, fail2ban, Let's Encrypt
and Roundcube on one Ubuntu 24.04 or Debian 12 host.

Nothing in here assumes `vitaqueen.com`. Every hostname comes from `mail.env`,
so it builds a mail server for any domain — including a personal one.

## Before you spend money

Three things decide whether this works, and none of them are in this
directory. Check them on the trial instance, before the year's invoice:

1. **A dedicated IPv4 address**, not shared with a hosting neighbour who sends
   marketing.
2. **A PTR record you can set**, pointing at your `MAIL_HOSTNAME`. Only the
   provider can do it. Ask before you buy.
3. **Outbound port 25, unblocked.** Most clouds block it by default and some
   never unblock it: `nc -vz gmail-smtp-in.l.google.com 25`.

A mail server missing any one of these is a mail server whose mail goes to
spam, and no amount of configuration fixes it.

## Install

```bash
cp mail.env.example mail.env
$EDITOR mail.env                 # domain, hostname, first user
sudo ./install-mail.sh           # pass 1: packages, DKIM keys, DNS records
```

The first run stops on purpose once it has printed the DNS records — nothing
can get a certificate for a name that does not resolve yet. Publish them, set
the PTR record, then:

```bash
sudo ./install-mail.sh           # pass 2: certificates, config, first mailbox
mail-check                       # verify all of it
```

`install-mail.sh` is idempotent. Re-running never regenerates a DKIM key,
never resets a password, and never overwrites `mail.env`; any configuration
file it replaces is copied to `*.bak.<timestamp>` first.

## Afterwards

```bash
mailbox add sara@example.com          # create a mailbox, print its password once
mailbox alias sales@example.com sara@example.com
mailbox sender sales@example.com sara@example.com,ali@example.com
mailbox quota sara@example.com 20G
mailbox list

dns-records                           # every record, filled in with the real keys
dns-records --zone                    # …as a BIND fragment
mail-check                            # ports, TLS, DNS, relay behaviour
mail-check --dns                      # DNS only; runs from anywhere

mail-expunge --dry-run                # what the retention sweep would delete
mail-backup --restore-test            # prove the backup restores
```

`install-mail.sh` copies all five into `/usr/local/sbin`.

## What is where

| Path | What it is |
| --- | --- |
| `mail.env.example` | The only file you edit |
| `install-mail.sh` | The installer, in two passes |
| `bin/mailbox` | Accounts, aliases, quotas, and who may send as what |
| `bin/dns-records` | Prints the DNS this server actually needs |
| `bin/mail-check` | Verifies it from the outside in |
| `bin/mail-expunge` | Retention sweep over the role mailboxes |
| `bin/mail-backup` | restic to off-site storage, with a restore test |
| `postfix/` | `main.cf`, `master.cf`, submission header rewriting, TLS policy |
| `dovecot/` | One `local.conf` override, plus the after-Sieve spam rule |
| `rspamd/local.d/` | Scoring thresholds, DKIM/ARC signing, rate limits, ClamAV |
| `nginx/` | Webmail, auto-configuration, and the MTA-STS policy |
| `fail2ban/`, `logrotate/`, `systemd/` | Bans, log retention, backup and retention timers |
| `autoconfig/` | Thunderbird and Outlook client setup, and the MTA-STS policy file |
| `certbot/` | The deploy hook that reloads Postfix and Dovecot on renewal |

Templates carry `__PLACEHOLDERS__` that `install-mail.sh` fills in from
`mail.env`. Edit the template and re-run the installer — a change made
directly in `/etc` is a change the next run will disagree with.

## Three things it does that are easy to miss

- **It disables Dovecot's system authentication.** Debian ships a PAM passdb
  ahead of the virtual one, so out of the box every Unix account on the host
  can log into IMAP with its shell password. The installer comments the
  include out and then checks that it worked.
- **`milter_default_action = tempfail`.** Rspamd signs outbound mail; if it is
  down and Postfix carries on, every message leaves unsigned and fails DMARC
  at the far end. A short deferral is cheaper than an afternoon of mail that
  arrives looking forged.
- **unbound is not optional.** Spamhaus and most blocklists refuse queries
  from public resolvers. Point Rspamd at 8.8.8.8 and every message scores as
  spam with nothing in the log to say why.

## Verified against

Ubuntu 24.04: Postfix 3.8.6, Dovecot 2.3.21, Rspamd 3.8.1. The Postfix
parameter names, the `pcre` header rules, the Dovecot configuration and every
Rspamd module in here parse under those versions — `postconf`, `doveconf -n`,
`sievec` and `rspamadm configtest` were run against the rendered output.

Dovecot 2.4 rewrote the configuration language. Do not carry `dovecot/local.conf`
forward to it unread.
