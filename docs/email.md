# Email

How VitaQueen gets its own mail: the mailboxes staff read, the mail the
application sends, and the DNS records that decide whether anyone believes
either of them.

This document is the architecture. It states what runs where, what each piece
is responsible for, and — where a choice was made — what the alternative cost.

It is also built: [`infra/mail/`](../infra/mail/) is this architecture as
configuration files and an installer, for any domain.

## Three flows, not one

"Set up a mail server" is three different systems wearing one name. They have
different failure modes and they must be designed separately.

| Flow | Example | Fails as |
| --- | --- | --- |
| **Inbound** | A Russian distributor writes to `export@vitaqueen.com` | Lost business, silently |
| **Human outbound** | Sales replies from `sales@` to a Gmail address | Reply lands in spam, silently |
| **Application outbound** | `ContactMessageReceived` mails the enquiry to `sales@` | Enquiry never reaches a human |

The third flow is the one this repository already depends on
(`apps/api/app/Notifications/ContactMessageReceived.php`), and it is the
easiest: today it is delivered from the server to a mailbox **on the same
server**, so it never crosses the internet and no third party gets a vote.

The second flow is the hard one. Deliverability is not a property of a working
mail server — it is a property of a reputation you have to build and keep. Plan
the architecture around flow 2 and the other two come free.

## The shape of the thing

```
                              INTERNET
                                 │
         ┌───────────────────────┼────────────────────────┐
         │ :25  MX, inbound      │ :465/:587 submission   │ :993 IMAP
         ▼                       ▼                        ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  mail.vitaqueen.com — its own host, its own IPv4, its own PTR │
  │                                                              │
  │   POSTFIX ──── milter ────▶ RSPAMD ──────▶ REDIS             │
  │     │  MTA + submission       │  SPF · DKIM · DMARC · ARC     │
  │     │                         │  RBL · bayes · rate limits    │
  │     │ LMTP                    └──────────▶ CLAMAV             │
  │     ▼                                                        │
  │   DOVECOT   IMAP · LMTP · Sieve · quota · ManageSieve         │
  │     │                                                        │
  │     ▼                                                        │
  │   /var/vmail   Maildir on its own volume, snapshotted         │
  │                                                              │
  │   ROUNDCUBE  (webmail, nginx + PHP-FPM, same host)            │
  └──────────────────────────────────────────────────────────────┘
         ▲
         │ :465, authenticated as app@, locked to one envelope sender
         │
    LARAVEL  api.vitaqueen.com ──▶ redis queue ──▶ queue:work (systemd)
```

Everything above the dashed line is one host. Everything below it is the
existing application stack in `docs/architecture.md`, unchanged except for four
environment variables.

## Decide this before anything else

Self-hosting mail is a real commitment. Not because it is hard to install — it
is a day — but because it never finishes. Certificates rotate, blocklists
change their minds, Microsoft decides your IP is new, a staff password leaks and
your domain is on Spamhaus by lunchtime. **One named person has to own it.**

| Option | What it is | Choose when | What it costs |
| --- | --- | --- | --- |
| **A · Hosted mailboxes** | Google Workspace, Microsoft 365, or a regional provider | Nobody will own an MTA | Per-seat fee forever; the provider must accept your account and jurisdiction; your mail lives on their disks |
| **B · Self-hosted** *(this document)* | Postfix · Dovecot · Rspamd on a VPS you control | One person owns it, and the fixed cost and the control are both worth it | ~1 day to build, ~2 h/month forever, and a cold IP reputation you have to earn |
| **C · Hybrid** | Hosted mailboxes for people, your own submission relay for the app | Deliverability matters and ops time does not exist | Two systems, two DKIM keys, the same DNS discipline anyway |
| **D · Forward-only** | Cloudflare Email Routing forwards `info@` to an existing inbox | Pre-launch, three addresses, no staff | You cannot *send* as `@vitaqueen.com`; every reply exposes a personal address |

**Recommendation: B if the owner exists, C if not.** D is fine for the weeks
before launch and is a dead end after it — a factory whose export enquiries are
answered from a personal Gmail address does not look like a factory.

The rest of this document describes B. Under C, sections
[DNS](#dns-is-the-actual-mail-server) and
[The application side](#the-application-side) still apply in full; the provider
replaces sections 4–8.

## Where it runs, and why not on the web host

The mail host is a **separate machine from the web origin**. Four reasons, in
order of how much they would hurt:

1. **The MX record publishes an IP address.** `infra/nginx/vitaqueen.conf`
   accepts connections from Cloudflare ranges only, and the entire origin
   design in `docs/security.md` assumes the origin address is not public.
   Cloudflare does not proxy SMTP — an MX record is always a naked A record.
   Put mail on the web host and the MX lookup hands every attacker the origin
   address they are otherwise supposed to have to find.
2. **Port 25 is open to the world by definition.** An MTA is an unauthenticated
   service that accepts input from strangers. It does not belong on the machine
   holding the CMS database credentials.
3. **A mail queue is a disk-filling machine.** A backscatter storm or one large
   deferred attachment fills a partition. On a shared host that partition is
   also where MySQL writes.
4. **They reboot on different schedules.** Mail must survive; a Next.js deploy
   restarts things all day.

Minimum sane spec: 2 vCPU, 4 GB RAM (Rspamd's bayes and ClamAV are the memory,
not the mail), 40 GB system + a separate volume for `/var/vmail` sized at
`mailboxes × quota × 1.3`. Debian 12 or Ubuntu 24.04 LTS.

Three things about the IP address are not negotiable:

- **Dedicated IPv4**, not shared with a hosting neighbour who sends marketing.
- **Forward-confirmed reverse DNS**: `PTR` for the IP resolves to
  `mail.vitaqueen.com`, and that name resolves back to the same IP. Gmail and
  Outlook both treat a missing or mismatched PTR as a strong negative signal.
  Only the hosting provider can set the PTR — confirm they will *before* you
  pay for the year.
- **Outbound port 25 unblocked.** Most clouds block it by default and some
  never unblock it. Test it on the trial instance before committing:
  `nc -vz gmail-smtp-in.l.google.com 25`.

**Do not publish an AAAA record for the MX unless IPv6 rDNS also works.** Gmail
is stricter over IPv6 than IPv4 and will reject mail from an IPv6 address with
no matching PTR. IPv4-only is a fine place to start and a trivial thing to add
later.

### On the regional constraint

The factory is in Iran (`APP_TIMEZONE=Asia/Tehran`) and sells into Arabic,
Russian and English-speaking markets. Two facts shape the hosting choice, and
both are commercial, not technical:

- The large international email providers and relay services (SES, Postmark,
  Mailgun, SendGrid, Resend and similar) commonly decline accounts with an
  Iranian billing or operating nexus. Do not design a critical path through one
  without written confirmation that they will serve you.
- Mail originating from IP ranges with a poor regional reputation is filtered
  harder by Gmail and Outlook regardless of how correct SPF, DKIM and DMARC are.
  Authentication buys you the right to be judged on reputation; it does not
  replace reputation.

Whichever provider or jurisdiction you choose, that is a legal and commercial
decision for the business — verify the provider's terms permit your use before
building on it. The architecture below is identical either way; only the IP
address changes. Note also that staff *inside* Iran reach an offshore host over
IMAP 993 and HTTPS webmail, and the webmail path is by far the more robust of
the two — which is one more reason Roundcube is in the diagram rather than
optional.

## The stack

| Component | Job | Why this one |
| --- | --- | --- |
| **Postfix** | SMTP: MX on 25, submission on 465/587, queue, routing | The reference MTA. Its configuration is boring, documented and survivable by whoever inherits it. |
| **Dovecot** | IMAP, LMTP delivery, Sieve, quotas, authentication | The only serious choice. Its `doveadm` tooling is what makes migrations and backups possible. |
| **Rspamd** | Spam scoring, DKIM/ARC signing, DMARC checking, rate limits, greylisting | Replaces SpamAssassin + OpenDKIM + policyd + postgrey with one milter and one config tree. Signing and filtering in one place is the reason this architecture has five boxes instead of nine. |
| **Redis** | Rspamd's bayes, fuzzy, greylist and rate-limit state | Rspamd needs it. Use a *local* Redis on the mail host — not the application's. |
| **ClamAV** | Attachment scanning, via Rspamd's antivirus module | Cheap, and the recipients are staff opening PDFs from strangers. |
| **Roundcube** | Webmail | Works from any device without a mail client, works over HTTPS. |
| **certbot** | TLS certificates, DNS-01 challenge | DNS-01 means the mail host never needs port 80 open. |

### Packaged alternative

**Mailcow-dockerized** and **Mailu** are the same architecture — Postfix,
Dovecot, Rspamd, Redis, webmail — assembled and updated for you, with an admin
UI. If nobody on the team enjoys `main.cf`, use one of them: an updated
packaged stack beats a hand-rolled one that nobody patches. Everything in
[DNS](#dns-is-the-actual-mail-server), [Addresses](#addresses-and-mailboxes),
[The application side](#the-application-side) and
[Operations](#operations) applies unchanged.

### Where the accounts live

Two options, and the smaller one is right here:

- **Flat files** — `/etc/postfix/vmailbox`, `/etc/dovecot/users` with
  `{ARGON2ID}` hashes. For fifteen mailboxes this removes an entire database
  dependency from the mail path, and provisioning is a five-line script.
  *(Dovecot needs to have been built against libsodium for ARGON2ID; if not,
  `BLF-CRYPT` is the fallback.)*
- **MySQL** — `mail_domains`, `mail_users`, `mail_aliases`, read by Postfix and
  Dovecot through a SELECT-only user. Worth it the moment you want a
  self-service password page or more than ~50 accounts.

**Start with files.** The application's MySQL is on another host and must stay
there; adding a database to the mail host to store fifteen rows is a service to
back up, patch and monitor for no return.

## Building it

`infra/mail/` is this document as files. One machine, two passes:

```bash
cp mail.env.example mail.env && $EDITOR mail.env
sudo ./install-mail.sh      # packages, DKIM keys, and the DNS records to publish
#   … publish them, set the PTR record …
sudo ./install-mail.sh      # certificates, configuration, first mailbox
mail-check                  # verify all of it
```

The first pass stops once it has printed the DNS, because no certificate can be
issued for a name that does not resolve. The installer is idempotent: it never
regenerates a DKIM key, resets a password or overwrites `mail.env`, and any
file it replaces is copied aside first.

Afterwards there are five commands in `/usr/local/sbin`:

| Command | What it does |
| --- | --- |
| `mailbox` | Accounts, aliases, quotas, and who may send as what — keeping Dovecot's user list and Postfix's two maps in agreement, which is the thing that goes wrong when it is done by hand |
| `dns-records` | Every record this server needs, with the live DKIM keys filled in |
| `mail-check` | Ports, TLS, DNS, PTR, and whether the server relays for strangers |
| `mail-expunge` | The retention sweep described below |
| `mail-backup` | restic to off-site storage, with `--restore-test` |

Everything in `infra/mail/` is templated on `mail.env`, so it builds a mail
server for any domain — the factory's or a personal one. The Postfix, Dovecot,
Rspamd and Sieve configuration there parses under the versions Ubuntu 24.04
ships; `infra/mail/README.md` says which, and what was checked.

## Names, ports and the firewall

| Name | Purpose |
| --- | --- |
| `mail.vitaqueen.com` | The host itself: MX target, HELO name, PTR target, what clients connect to, what the TLS certificate is for |
| `webmail.vitaqueen.com` | Roundcube (may be the same host and certificate) |
| `mta-sts.vitaqueen.com` | Static policy file — served by the **existing web origin**, not the mail host |
| `autoconfig` / `autodiscover.vitaqueen.com` | Client auto-setup |
| `bounce.vitaqueen.com` | Envelope sender for application mail (see [Identity split](#identity-who-signs-what)) |

| Port | Service | Exposure | Notes |
| --- | --- | --- | --- |
| 25 | SMTP, inbound MX | World | No authentication, no relaying. `smtpd_tls_security_level = may` — opportunistic only; demanding TLS here silently loses mail from senders that do not offer it. |
| 465 | Submission, implicit TLS | World | **The default for staff and for the app.** RFC 8314 prefers it: TLS from the first byte, nothing to downgrade. |
| 587 | Submission, STARTTLS | World | Kept for clients that only know 587. `smtpd_tls_security_level = encrypt` — mandatory. |
| 993 | IMAPS | World | Implicit TLS. |
| 4190 | ManageSieve | VPN/office only | Server-side rules. Rarely needed; do not expose it by habit. |
| 143 / 110 / 995 | IMAP/POP cleartext | **Closed** | POP3 is not offered at all. A mailbox that can be drained to one laptop is a mailbox that is not backed up. |
| 22 | SSH | Key-only, restricted source | |
| 80 / 443 | Webmail | World | 80 redirects. Certificates are issued over DNS-01, so 80 is not needed for ACME. |

Everything else: default deny, inbound and **outbound**. Egress filtering
matters here — a compromised mail host that cannot reach arbitrary ports is
much less useful to whoever compromised it.

`fail2ban` watches Postfix SASL failures and Dovecot auth failures. Rspamd's
`ratelimit` module is the second lock and the one that actually bounds the
damage: it caps what a *successful* login can send.

## DNS is the actual mail server

More mail is lost to a missing DNS record than to a broken daemon. Addresses
below use `203.0.113.10` as a placeholder for the mail host's IPv4.

| Record | Type | Value | Notes |
| --- | --- | --- | --- |
| `mail.vitaqueen.com` | A | `203.0.113.10` | **DNS-only in Cloudflare — grey cloud.** Proxying it breaks SMTP and hides nothing. |
| *(PTR for `203.0.113.10`)* | PTR | `mail.vitaqueen.com` | Set at the hosting provider, not in your zone. |
| `vitaqueen.com` | MX | `10 mail.vitaqueen.com.` | One MX. See below on backup MX. |
| `vitaqueen.com` | TXT | `v=spf1 mx -all` | `mx` authorises exactly the host that is your MX. Start with `~all`, move to `-all` after two weeks of clean DMARC reports. |
| `mail._domainkey` | TXT | `v=DKIM1; k=rsa; p=MIIBI…` | 2048-bit. Selector for staff mail. |
| `app._domainkey` | TXT | `v=DKIM1; k=rsa; p=MIIBI…` | Separate key for application mail. Separate keys can be rotated and revoked independently. |
| `_dmarc` | TXT | `v=DMARC1; p=none; sp=none; adkim=r; aspf=r; fo=1; rua=mailto:dmarc@vitaqueen.com` | Starts at `none`. See the rollout. |
| `_mta-sts` | TXT | `v=STSv1; id=2026090101` | `id` **must** change every time the policy file changes. |
| `mta-sts` | CNAME/A | web origin | Serves `/.well-known/mta-sts.txt` over HTTPS. |
| `_smtp._tls` | TXT | `v=TLSRPTv1; rua=mailto:tlsrpt@vitaqueen.com` | Tells you when a sender could not negotiate TLS to you. Cheap, and the only warning you will get. |
| `autodiscover` | CNAME | `mail.vitaqueen.com.` | Outlook. |
| `autoconfig` | CNAME | `mail.vitaqueen.com.` | Thunderbird. |
| `_submissions._tcp` | SRV | `0 1 465 mail.vitaqueen.com.` | |
| `_imaps._tcp` | SRV | `0 1 993 mail.vitaqueen.com.` | |
| `api.vitaqueen.com` | MX / TXT | `0 .` / `v=spf1 -all` | **Null MX** (RFC 7505) and a null SPF on every hostname that never sends or receives. Unclaimed subdomains are what spoofers reach for. |
| `media.vitaqueen.com` | MX / TXT | `0 .` / `v=spf1 -all` | Same. |
| `bounce.vitaqueen.com` | MX / TXT | `10 mail.vitaqueen.com.` / `v=spf1 mx -all` | Must receive: this is where application bounces land. |

MTA-STS policy, served at `https://mta-sts.vitaqueen.com/.well-known/mta-sts.txt`
with `Content-Type: text/plain`:

```
version: STSv1
mode: testing
mx: mail.vitaqueen.com
max_age: 604800
```

`testing` for the first two weeks — TLS-RPT reports arrive but nothing is
enforced — then `mode: enforce` and a new `id`. This is a plain static file; the
existing nginx serves it in five lines, and it may sit behind Cloudflare.

**Do not add a backup MX.** A secondary MX on a second host is the oldest
instinct in mail administration and, for a setup this size, a net loss: it is a
spam magnet that skips your filtering, it delays real mail, and it turns a
30-minute outage into a queue on a machine you patch less often. Sending servers
already retry for days. One MX, watched.

**DANE (TLSA) is deliberately omitted.** It needs DNSSEC on the zone *and*
certificate-rollover automation that matches your ACME renewals; get it wrong
and mail from DANE-validating senders stops dead. MTA-STS covers the same
threat for the senders that matter to a factory. Add DANE later, deliberately.

## Identity: who signs what

| Mail | `From:` | Envelope sender (Return-Path) | DKIM |
| --- | --- | --- | --- |
| Staff | `sales@vitaqueen.com` | same | `d=vitaqueen.com`, selector `mail` |
| Application | `noreply@vitaqueen.com` | `bounces@bounce.vitaqueen.com` | `d=vitaqueen.com`, selector `app` |
| Bulk / newsletter *(if ever)* | `news@news.vitaqueen.com` | same | `d=news.vitaqueen.com`, selector `bulk` |

The split exists because reputation is scored per domain **and** per subdomain.
Application mail is low-volume and low-risk, so it keeps the brand `From:` and
earns alignment through relaxed DMARC (`adkim=r`, `aspf=r`) — a Return-Path at
`bounce.vitaqueen.com` aligns with a `From:` at `vitaqueen.com` because the
organisational domain matches. Bulk mail is where reputation actually gets
burned, so if a newsletter ever appears it moves to its own subdomain
completely, `From:` included, and it can be ruined without taking `sales@` down
with it.

The separate envelope domain also keeps bounces out of the humans' inboxes:
delivery failures for application mail go to `bounces@`, which is a mailbox a
script reads, not a person.

Postfix enforces the other half of this with `smtpd_sender_login_maps` and
`reject_sender_login_mismatch`: the `app@` credential may set exactly one
envelope sender and exactly one `From:`. A leaked application password then
cannot be used to send as `sales@`.

## Addresses and mailboxes

The application already routes enquiries by topic
(`apps/api/config/vitaqueen.php`), so these five must exist and must be read:

| Address | From `config/vitaqueen.php` | Kind |
| --- | --- | --- |
| `info@` | `mailboxes.general` | Shared mailbox |
| `sales@` | `mailboxes.sales` | Shared mailbox |
| `export@` | `mailboxes.export` | Shared mailbox |
| `quality@` | `mailboxes.quality` | Shared mailbox |
| `hr@` | `mailboxes.career` | Shared mailbox, restricted ACL |

Plus the ones the internet expects or the architecture requires:

| Address | Why |
| --- | --- |
| `postmaster@` | RFC 2142. Other operators use it to tell you that you are broken. **It must reach a human.** |
| `abuse@` | RFC 2142. Skipping it is how a provider decides you are the problem. |
| `dmarc@` | Aggregate reports. High volume, machine-readable, own mailbox. |
| `tlsrpt@` | TLS reports. Same. |
| `noreply@` | The application's `From:`. Not a black hole: it accepts mail and files it to a mailbox nobody answers, because *rejecting* replies to a notification loses real customer replies sent by people who did not read the address. |
| `bounces@bounce.…` | Application delivery failures. |

**Shared mailboxes, not aliases fanned out to personal accounts.** An alias
means five copies, five people assuming someone else replied, and a reply
thread that exists only in one person's Sent folder. A shared mailbox with a
Dovecot ACL means the conversation lives in one place, and the person answering
sends *as* `sales@` (permitted through `smtpd_sender_login_maps`), so the
customer's reply comes back to the team.

**No catch-all, ever.** A catch-all accepts mail for addresses that do not
exist, which makes address-harvesting free and turns every typo into either
backscatter or a spam bucket someone has to read. Unknown recipients are
rejected at RCPT time with a 5xx, which is the sending server's problem to
report, not yours.

Personal addresses: `firstname.lastname@vitaqueen.com`. Decide it once, write it
down, and do not let the first exception happen.

## Inbound path

```
:25 ──▶ Postfix smtpd
          │  reject_unknown_reverse_client_hostname (score, don't reject)
          │  reject_non_fqdn_sender / reject_unknown_sender_domain
          │  reject_unauth_destination        ← never an open relay
          │  reject_unlisted_recipient        ← no catch-all
          ▼
        Rspamd milter (:11332)
          │  SPF · DKIM · DMARC · ARC verification
          │  RBLs · greylisting · fuzzy · bayes · phishing
          │  ClamAV
          │  score ≥ 15 → reject at SMTP time
          │  score ≥ 6  → deliver, marked
          ▼
        Dovecot LMTP
          │  Sieve: file marked mail to Junk, per-mailbox rules
          │  quota check
          ▼
        Maildir
```

The rule that matters: **reject during the SMTP conversation, never accept and
bounce afterwards.** A 5xx at RCPT or DATA time makes the sender's server
generate the failure notice to its own user. Accepting first and bouncing later
sends that notice to whoever the spammer forged, which is how a well-meaning
server becomes a backscatter source and ends up on a blocklist.

Greylisting is on. It costs first-time senders a few minutes' delay and removes
a large share of bulk spam that never retries. If a distributor complains about
delays, whitelist their domain rather than turning it off.

## Outbound path

```
Staff client / Roundcube ──▶ :465 submission, SASL over TLS
Laravel (queue worker)   ──▶ :465 submission, SASL, sender-locked
                                   │
                                   │ Rspamd: rate limits + DKIM signing
                                   │   (selector chosen by envelope domain)
                                   ▼
                              Postfix queue
                                   │ smtp_tls_security_level = may
                                   │ + MTA-STS/enforce for known destinations
                                   ▼
                              Recipient MX
```

Outbound rate limits are the kill switch that fires before you notice:

| Bucket | Limit | Reasoning |
| --- | --- | --- |
| Per staff account | ~200 messages/hour | Far above any human; far below a spam run |
| `app@` account | ~60 messages/hour | The contact form is rate-limited to 1 r/s at nginx and the app; 60/h is generous |
| Whole domain | ~2 000 messages/day | The ceiling that keeps a total compromise from costing the domain its reputation |

Tune them upward when a real workload proves them wrong. A rate limit that has
never been hit is not evidence it is too high.

## The application side

This is the part that lives in this repository. Four variables and one running
worker.

```env
# apps/api/.env
MAIL_MAILER=smtp
MAIL_SCHEME=smtps                 # implicit TLS; required for port 465
MAIL_HOST=mail.vitaqueen.com
MAIL_PORT=465
MAIL_USERNAME=app@vitaqueen.com
MAIL_PASSWORD=…                   # its own credential, nobody's personal one
MAIL_FROM_ADDRESS=noreply@vitaqueen.com
MAIL_EHLO_DOMAIN=api.vitaqueen.com
```

Four notes:

- **`MAIL_SCHEME`, not `MAIL_ENCRYPTION`.** `config/mail.php` reads
  `MAIL_SCHEME`; Laravel 11 dropped `encryption` from the default SMTP mailer.
  Setting `MAIL_ENCRYPTION=tls` against port 465 does nothing and the connection
  fails with a TLS error that does not mention the cause. `.env.example` has
  been corrected accordingly.
- **Use the `failover` mailer once you trust it.** `config/mail.php` already
  defines `failover` as `smtp → log`. With `MAIL_MAILER=failover`, a mail outage
  degrades to a log line instead of a failed job — worth it for a notification
  whose content is also in the database.
- **The queue worker is not optional.** `ContactMessageReceived` implements
  `ShouldQueue`, which means that without a running worker every enquiry
  notification sits in Redis forever while the site cheerfully returns `202`.
  Run it under systemd, with `--tries=5 --backoff=60,300,900`, and alert on
  `failed_jobs` growing. This is the single most likely way for this
  architecture to fail silently.
- **The API host is the only machine allowed to authenticate as `app@`.**
  Restrict it by source address on the mail host; the credential should be
  worthless anywhere else.

### The retention contradiction

`docs/security.md` promises that a contact message loses its IP address and user
agent after `CONTACT_PII_RETENTION_DAYS` (90). But the notification email copies
the enquirer's name, email, phone, company and full message into `sales@`, where
it stays until someone deletes it — which is never. The database honours the
policy and the mailbox quietly does not.

Two changes close it, and both are follow-up work rather than part of this
document:

1. **Send a pointer, not a payload.** The notification carries topic, reference
   ID, language and a link into the admin panel; the enquiry itself stays in the
   database where the retention job can reach it. Keep `replyTo` as it is — it
   is what makes a one-click reply work, and it is already correctly *not* used
   as `From:`.
2. **Give the role mailboxes a retention rule.** A monthly `doveadm expunge`
   over mail older than the retention window in the shared mailboxes, matching
   the number in `config/vitaqueen.php` rather than a number invented on the
   mail host.

### Local development does not change

`infra/docker/docker-compose.yml` runs Mailpit on 1025 and it stays. Nothing in
development ever points at the real mail server, and staging never holds a copy
of the production DKIM key — a staging box that can sign as `vitaqueen.com` is a
production credential with a casual password.

## Operations

### Watch these

| Signal | Where | Alert when |
| --- | --- | --- |
| Queue depth | `postqueue -p` | Deferred > 50, or anything older than 4 hours |
| Failed jobs | Laravel `failed_jobs` | Any row |
| Disk on `/var/vmail` | node exporter | > 80 % |
| Certificate expiry | certbot / probe | < 14 days |
| Auth failures | Dovecot + Postfix logs | Sudden rate change, not absolute count |
| Blocklists | Spamhaus, Barracuda, SORBS | Any listing |
| DMARC reports | `dmarc@` | Any `fail` you cannot explain |
| Google Postmaster Tools | External | Spam rate ≥ 0.1 % |
| Microsoft SNDS + JMRP | External | Any complaint |

Register for Postmaster Tools and SNDS on day one. They are the only view you
get of what the two mailbox providers that matter actually think of you, and
both need a DNS TXT to verify — do it while you are editing the zone anyway.

**Mail logs are personal data.** They contain every sender and recipient
address. Rotate at 14–30 days, which is also roughly what you need to debug a
delivery complaint, and note it wherever the retention policy is written down.

### Runbook

**Gmail is deferring or spam-foldering us.** Check, in order: PTR still
resolving; DKIM verifying (`opendkim-testkey` or a test to a report service);
DMARC reports for the failing source; Postmaster Tools spam rate; blocklists.
The cause is almost never the mail server — it is a new IP with no history, or
one staff member's account sending something a filter dislikes.

**The queue is growing.** `postqueue -p` shows the destination. One destination
means a remote problem — leave it, Postfix retries. Every destination means DNS,
TLS or a blocklist, and the logs say which.

**An account is compromised** (rate limit tripped, or a provider complains):
disable the account in Dovecot first, then `postsuper -d` the queued mail from
that sender, then rotate the password, then find out how. In that order — every
minute of sending is reputation you buy back over weeks. The rate limits above
exist so that this costs you an hour of mail rather than the domain.

**Certificate renewal failed.** DNS-01 needs a valid API token; check its expiry
before assuming ACME is broken. Postfix and Dovecot both need an explicit reload
on renewal — the deploy hook is part of the build, not an afterthought.

### Backups

`/var/vmail` and `/etc` (Postfix, Dovecot, Rspamd config, **and the DKIM private
keys**) to offsite storage, nightly, encrypted. `doveadm backup` to a second
host gives a warm standby that can be promoted; restic to object storage gives
history. Do both if the mail matters; do restic if you must choose.

Restore-test quarterly by mounting the backup and opening a mailbox. As
`docs/security.md` says of the database: an untested backup is a hypothesis.

Losing the DKIM private key is not fatal — publish a new selector and move on.
Losing `/var/vmail` is the end of a decade of commercial correspondence.

## Rollout

Each phase has an exit criterion. Do not start the next one until it is met.

| Phase | Work | Done when |
| --- | --- | --- |
| **0 · Prove the ground** | Provision the host. Confirm dedicated IPv4, PTR set, port 25 open outbound, IP not already on a blocklist. | A test message from the raw host reaches a Gmail inbox at all. |
| **1 · Build** | `install-mail.sh`, first pass: packages, DKIM keys, and the record list. | The installer stops of its own accord and prints the DNS. |
| **2 · Authenticate** | Publish what `dns-records` printed — A, SPF, both DKIM selectors, DMARC `p=none` with `rua`, TLS-RPT, null MX on non-mail names. Lower TTLs first. Set the PTR. Then the second pass. | `mail-check` is green, and a test to a mail-check service scores SPF, DKIM and DMARC all `pass`, and aligned. |
| **3 · Cut over** | Publish the MX. Watch the logs. | Real mail arrives; nothing in `postqueue -p`. |
| **4 · Move the people** | Create mailboxes, set up clients, publish autoconfig/autodiscover, migrate existing mail with `imapsync` if there is any. | Staff are reading and replying from the new mailboxes for a week. |
| **5 · Move the application** | Point `apps/api/.env` at the mail host, start the queue worker, submit a real contact form in each locale. | The enquiry lands in the right mailbox and `failed_jobs` is empty. |
| **6 · Tighten** | SPF `~all` → `-all`. DMARC `none` → `quarantine` → `reject`, watching reports for two weeks at each step. MTA-STS `testing` → `enforce` with a new `id`. | `p=reject`, `mode: enforce`, and DMARC reports showing only your own sources. |

Phase 6 is the one people skip. `p=none` publishes a policy that asks receivers
to do nothing about mail forged as you — which is most of the value of the whole
exercise, left on the table.

## What is deliberately not here

| Not covered | Why, and what to do |
| --- | --- |
| **Calendars and contacts** | Groupware is a different product. Add SOGo or a CalDAV/CardDAV server next to Dovecot if the team needs shared calendars; it does not change anything above. |
| **Newsletters and campaigns** | Bulk mail belongs on `news.vitaqueen.com` with its own key, its own reputation and one-click unsubscribe (`List-Unsubscribe-Post`), and it is usually worth buying rather than hosting. Do not send it from the mailbox server. |
| **Compliance archiving** | Journaling every message to a tamper-evident store is a regulatory requirement, not a technical default. If export contracts demand it, it is a Postfix `always_bcc` to an archive mailbox plus a retention policy that overrides the one above. |
| **S/MIME and PGP** | End-to-end encryption is a client-side decision. Nothing here prevents it. |
| **DANE / TLSA** | Explained above: needs DNSSEC plus rollover automation. MTA-STS first. |
| **BIMI** | Requires `p=reject` in place and a Verified Mark Certificate, which needs a registered trademark. Revisit after phase 6, as marketing. |
| **A second MX or a cluster** | Explained above. Two hosts double the patching and halve nobody's downtime at this size. |
| **The application code changes** | The mailbox half of the retention fix is built (`mail-expunge`, on a monthly timer). The application half — a notification that carries a reference rather than the whole enquiry — is described, not implemented: it is a behaviour change and belongs in its own commit. |

## Checklist

- [ ] Dedicated IPv4 with PTR → `mail.vitaqueen.com`, forward-confirmed
- [ ] Outbound port 25 verified open by the provider
- [ ] Mail host is **not** the web origin; MX does not expose the origin IP
- [ ] `mail` A record is DNS-only in Cloudflare (grey cloud)
- [ ] SPF, both DKIM selectors, DMARC with `rua`, MTA-STS, TLS-RPT published
- [ ] Null MX + `v=spf1 -all` on `api.`, `media.` and every non-mail name
- [ ] `postmaster@` and `abuse@` exist and reach a human
- [ ] No catch-all; unknown recipients rejected at RCPT
- [ ] Not an open relay — verified from outside, not assumed
- [ ] Submission is TLS-only, authenticated, and sender-locked for `app@`
- [ ] Outbound rate limits set per account and per domain
- [ ] TLS certificate covers mail, webmail, autoconfig, autodiscover; renewal hook reloads Postfix *and* Dovecot
- [ ] `apps/api/.env` uses `MAIL_SCHEME=smtps` on port 465, with its own credential
- [ ] Queue worker running under systemd; `failed_jobs` alerting
- [ ] Google Postmaster Tools and Microsoft SNDS/JMRP registered
- [ ] Backups running offsite and restore-tested, DKIM keys included
- [ ] Mail log rotation set to 14–30 days
- [ ] DMARC at `p=reject` and MTA-STS at `enforce` once reports are clean
