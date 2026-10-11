/**
 * The parts of the data layer that both the Next.js server and the command
 * line (`scripts/db.mjs`) need: where the database lives, how it is opened,
 * how the schema is brought up to date, and how passwords are hashed.
 *
 * Plain JavaScript on purpose. The CLI runs under bare `node` on the server,
 * with no TypeScript toolchain and no bundler in front of it, and the two
 * callers must never disagree about the password format or the schema.
 *
 * Built only on Node's own modules: `node:sqlite` is the database, and
 * `node:crypto` provides scrypt.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

/**
 * Everything the application writes at runtime lives under this directory.
 *
 * The `turbopackIgnore` hints below tell the bundler these are runtime paths,
 * not files to trace into the build output.
 */
export function dataDir() {
  return resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || join(process.cwd(), 'data'));
}

export function databasePath() {
  return join(dataDir(), 'vitaqueen.db');
}

export function now() {
  return new Date().toISOString();
}

export function openDatabase(file = databasePath()) {
  mkdirSync(dataDir(), { recursive: true, mode: 0o750 });

  const db = new DatabaseSync(file);
  // WAL lets the public site keep reading while the admin panel writes, and a
  // busy timeout turns a brief lock into a short wait instead of an error.
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
  return db;
}

/**
 * Runs `fn` inside a transaction, or inside a savepoint when one is already
 * open, so helpers can be composed without caring who started it.
 */
let depth = 0;
export function transaction(db, fn, { immediate = false } = {}) {
  const savepoint = `sp_${depth}`;
  if (depth === 0) db.exec(immediate ? 'BEGIN IMMEDIATE' : 'BEGIN');
  else db.exec(`SAVEPOINT ${savepoint}`);
  depth += 1;

  try {
    const result = fn();
    depth -= 1;
    if (depth === 0) db.exec('COMMIT');
    else db.exec(`RELEASE ${savepoint}`);
    return result;
  } catch (error) {
    depth -= 1;
    if (depth === 0) db.exec('ROLLBACK');
    else db.exec(`ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`);
    throw error;
  }
}

function migrationsDir() {
  return process.env.MIGRATIONS_DIR || join(/* turbopackIgnore: true */ process.cwd(), 'db', 'migrations');
}

/**
 * Applies every `db/migrations/NNNN_name.sql` that has not been applied yet.
 *
 * The whole run takes a write lock (`BEGIN IMMEDIATE`) before it even reads the
 * version table. `next build` renders with several workers at once, and each
 * of them opens the database; without the lock two of them would both decide
 * that version 1 is missing and both try to create the tables.
 */
export function migrate(db) {
  const files = readdirSync(/* turbopackIgnore: true */ migrationsDir())
    .filter((name) => /^\d{4}_[\w-]+\.sql$/.test(name))
    .sort();

  return transaction(
    db,
    () => {
      db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )`);

      const applied = new Set(
        db.prepare('SELECT version FROM schema_migrations').all().map((row) => Number(row.version)),
      );

      const ran = [];
      for (const file of files) {
        const version = Number(file.slice(0, 4));
        if (applied.has(version)) continue;

        db.exec(readFileSync(/* turbopackIgnore: true */ join(migrationsDir(), file), 'utf8'));
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          version,
          file,
          now(),
        );
        ran.push(file);
      }
      return ran;
    },
    { immediate: true },
  );
}

// --- Passwords ---------------------------------------------------------------

/**
 * scrypt parameters. N = 2^15 costs roughly 50–100 ms and 32 MB per hash on a
 * small VPS: slow enough to make offline guessing expensive, fast enough that
 * a login does not feel it. The parameters are stored with every hash, so they
 * can be raised later without invalidating existing passwords.
 */
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keyLength: 64 };

function scrypt(password, salt, { N, r, p, keyLength }) {
  return new Promise((resolvePromise, reject) => {
    scryptCallback(password, salt, keyLength, { N, r, p, maxmem: 128 * N * r * 2 }, (error, key) =>
      error ? reject(error) : resolvePromise(key),
    );
  });
}

/** `scrypt$N$r$p$salt$hash`, both binary parts base64. */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join(
    '$',
  );
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, N, r, p, salt, expected] = parts;
  const expectedKey = Buffer.from(expected, 'base64');
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    keyLength: expectedKey.length,
  });
  return key.length === expectedKey.length && timingSafeEqual(key, expectedKey);
}

/** Whether a stored hash was made with weaker parameters than today's. */
export function needsRehash(stored) {
  const [, N, r, p] = String(stored).split('$');
  return Number(N) < SCRYPT.N || Number(r) < SCRYPT.r || Number(p) < SCRYPT.p;
}

/** 20 characters from an alphabet with no look-alikes (no 0/O, 1/l/I). */
export function generatePassword(length = 20) {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  // `randomInt` rejects out-of-range draws, so every character is equally likely.
  for (let i = 0; i < length; i += 1) out += alphabet[randomInt(alphabet.length)];
  return out;
}

export const ROLES = ['super_admin', 'admin', 'editor', 'content_manager'];
