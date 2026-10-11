import type { DatabaseSync } from 'node:sqlite';

export type Role = 'super_admin' | 'admin' | 'editor' | 'content_manager';

export function dataDir(): string;
export function databasePath(): string;
export function now(): string;
export function openDatabase(file?: string): DatabaseSync;
export function transaction<T>(db: DatabaseSync, fn: () => T, options?: { immediate?: boolean }): T;
export function migrate(db: DatabaseSync): string[];
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, stored: string): Promise<boolean>;
export function needsRehash(stored: string): boolean;
export function generatePassword(length?: number): string;
export const ROLES: readonly Role[];
