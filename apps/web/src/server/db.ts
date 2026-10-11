import 'server-only';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { migrate, openDatabase, transaction } from '../../db/core.mjs';
import { seedSampleContent } from './seed';

/**
 * The application's one database connection.
 *
 * `node:sqlite` is synchronous and in-process, so there is no pool to manage
 * and a query is a function call. The handle lives on `globalThis` because
 * `next dev` re-evaluates modules on every edit, and each evaluation would
 * otherwise open another connection to the same file.
 */
const globalForDb = globalThis as unknown as { __vitaqueenDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalForDb.__vitaqueenDb) {
    const connection = openDatabase();
    migrate(connection);
    seedSampleContent(connection);
    globalForDb.__vitaqueenDb = connection;
  }
  return globalForDb.__vitaqueenDb;
}

export type Row = Record<string, SQLInputValue>;
/** Positional parameters. Booleans and `undefined` are accepted and normalised. */
export type Params = Array<SQLInputValue | boolean | undefined>;

/** `node:sqlite` refuses `undefined` and booleans; a parsed form passes both. */
function bind(params: Params = []): SQLInputValue[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

export function all<T = Row>(sql: string, params?: Params): T[] {
  return db().prepare(sql).all(...bind(params)) as T[];
}

export function get<T = Row>(sql: string, params?: Params): T | undefined {
  return db().prepare(sql).get(...bind(params)) as T | undefined;
}

export function run(sql: string, params?: Params) {
  const result = db().prepare(sql).run(...bind(params));
  return { changes: Number(result.changes), id: Number(result.lastInsertRowid) };
}

export function tx<T>(fn: () => T): T {
  return transaction(db(), fn);
}

export { now } from '../../db/core.mjs';
