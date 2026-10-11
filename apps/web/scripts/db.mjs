#!/usr/bin/env node
/**
 * Server-side maintenance for the VitaQueen database.
 *
 *   npm run db:migrate                         apply pending migrations
 *   npm run db:admin -- --email you@example.com [--name "…"] [--role super_admin] [--if-none]
 *                                              create an administrator; prints a generated password once
 *                                              (--if-none: only when the database has no users yet)
 *   npm run db:password -- --email you@example.com
 *                                              set a new generated password and sign out every session
 *   npm run db:reset-2fa -- --email you@example.com
 *                                              remove a lost second factor (re-enrolled at next login)
 *   npm run db:prune [-- --dry-run]            apply data-retention rules
 *   npm run db:backup [-- --to /path/file.db]  consistent copy of the live database
 *
 * Runs with plain `node`: no build step, no TypeScript, nothing but Node's own
 * modules and `db/core.mjs`, which the application shares.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// Run from the application directory whatever the caller's cwd, so DATA_DIR
// and the migrations resolve exactly as they do for `next start`.
const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(appDir);
for (const file of ['.env', '.env.production', '.env.local']) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const { openDatabase, migrate, hashPassword, generatePassword, databasePath, now, ROLES } = await import(
  '../db/core.mjs'
);

const [command = 'help', ...rest] = process.argv.slice(2);
const { values: options } = parseArgs({
  args: rest,
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'super_admin' },
    password: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    to: { type: 'string' },
    'if-none': { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const warn = (text) => console.log(`\x1b[33m${text}\x1b[0m`);
const fail = (text) => {
  console.error(`\x1b[31m${text}\x1b[0m`);
  process.exit(1);
};

const db = openDatabase();
const ran = migrate(db);

function requireEmail() {
  const email = options.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Pass a valid --email.');
  return email;
}

function audit(action, email, details) {
  db.prepare(
    `INSERT INTO audit_logs (user_email, action, resource_type, details, user_agent, created_at)
     VALUES (?, ?, 'user', ?, 'cli', ?)`,
  ).run(email, action, JSON.stringify(details ?? {}), now());
}

function checkPassword(password) {
  if (password.length < 12) fail('Passwords must be at least 12 characters.');
}

switch (command) {
  case 'migrate': {
    console.log(ran.length ? `Applied: ${ran.join(', ')}` : 'Schema is up to date.');
    console.log(`Database: ${databasePath()}`);
    break;
  }

  case 'create-admin': {
    const email = requireEmail();
    if (!ROLES.includes(options.role)) fail(`--role must be one of: ${ROLES.join(', ')}`);

    if (options['if-none'] && db.prepare('SELECT count(*) AS n FROM users').get().n > 0) {
      console.log('Administrators already exist; none created.');
      break;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      console.log(`User ${email} already exists; leaving it alone.`);
      break;
    }

    // A password typed on the command line ends up in shell history, so the
    // default is to generate one and show it exactly once.
    const password = options.password ?? generatePassword();
    checkPassword(password);

    const timestamp = now();
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
    ).run(options.name?.trim() || 'VitaQueen Admin', email, await hashPassword(password), options.role, timestamp, timestamp);
    audit('user_created', email, { role: options.role, via: 'cli' });

    console.log(`Created ${options.role} ${bold(email)}`);
    if (!options.password) {
      console.log(`Password: ${bold(password)}`);
      warn('This is shown once. Store it in a password manager; you will enrol 2FA at first login.');
    }
    break;
  }

  case 'reset-password': {
    const email = requireEmail();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) fail(`No user ${email}.`);

    const password = options.password ?? generatePassword();
    checkPassword(password);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      await hashPassword(password),
      now(),
      user.id,
    );
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    audit('password_reset', email, { via: 'cli' });

    console.log(`Password for ${bold(email)} replaced; every session was signed out.`);
    if (!options.password) {
      console.log(`Password: ${bold(password)}`);
      warn('This is shown once.');
    }
    break;
  }

  case 'reset-2fa': {
    const email = requireEmail();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) fail(`No user ${email}.`);

    db.prepare(
      'UPDATE users SET totp_secret = NULL, totp_confirmed_at = NULL, recovery_codes = NULL, updated_at = ? WHERE id = ?',
    ).run(now(), user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    audit('two_factor_disabled', email, { via: 'cli' });

    console.log(`Second factor removed for ${bold(email)}. They will enrol a new one at next login.`);
    break;
  }

  case 'prune': {
    const auditDays = Number(process.env.AUDIT_RETENTION_DAYS || 730);
    const piiDays = Number(process.env.CONTACT_PII_RETENTION_DAYS || 90);
    const auditCutoff = new Date(Date.now() - auditDays * 86_400_000).toISOString();
    const piiCutoff = new Date(Date.now() - piiDays * 86_400_000).toISOString();

    if (options['dry-run']) {
      const auditCount = db.prepare('SELECT count(*) AS n FROM audit_logs WHERE created_at < ?').get(auditCutoff).n;
      const piiCount = db
        .prepare(
          'SELECT count(*) AS n FROM contact_messages WHERE created_at < ? AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)',
        )
        .get(piiCutoff).n;
      console.log(`Audit rows to delete: ${auditCount}`);
      console.log(`Contact messages to anonymise: ${piiCount}`);
      break;
    }

    const deleted = db.prepare('DELETE FROM audit_logs WHERE created_at < ?').run(auditCutoff).changes;
    const anonymised = db
      .prepare(
        'UPDATE contact_messages SET ip_address = NULL, user_agent = NULL WHERE created_at < ? AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)',
      )
      .run(piiCutoff).changes;
    db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).run(now());
    db.prepare(`DELETE FROM rate_limits WHERE reset_at < ?`).run(Date.now());
    db.prepare(`INSERT INTO meta (key, value) VALUES ('pruned_at', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(now());

    console.log(`Deleted ${deleted} audit rows; anonymised ${anonymised} contact messages.`);
    break;
  }

  case 'backup': {
    // VACUUM INTO writes a consistent, compacted copy while the site keeps
    // running — copying the .db file with cp while WAL is active does not.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = options.to ?? join(dirname(databasePath()), 'backups', `vitaqueen-${stamp}.db`);
    mkdirSync(dirname(target), { recursive: true, mode: 0o750 });
    if (existsSync(target)) fail(`${target} already exists.`);
    db.prepare('VACUUM INTO ?').run(target);
    console.log(`Backup written to ${bold(target)}`);
    warn('Uploaded files live in DATA_DIR/uploads; back that directory up alongside this file.');
    break;
  }

  default:
    console.log(`Usage: node scripts/db.mjs <migrate | create-admin | reset-password | reset-2fa | prune | backup> [options]

  --email <address>     user to act on
  --name <name>         display name for create-admin
  --role <role>         ${ROLES.join(' | ')} (default super_admin)
  --password <value>    use this instead of a generated password (min. 12 characters)
  --dry-run             prune: report only
  --to <file>           backup: destination (default DATA_DIR/backups/…)`);
}

db.close();
