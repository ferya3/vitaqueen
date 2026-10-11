import 'server-only';
import { now, run } from './db';
import { clientIp, userAgent } from './request';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'login_succeeded'
  | 'login_failed'
  | 'logged_out'
  | 'password_changed'
  | 'password_reset'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'two_factor_failed'
  | 'recovery_code_used'
  | 'media_uploaded'
  | 'media_deleted'
  | 'message_handled'
  | 'user_created';

/**
 * Append-only record of who did what.
 *
 * Nothing in the application updates a row here, and nothing deletes one
 * except the retention job. `details` is a small JSON summary — the fields
 * that changed, never secrets or password material.
 */
export async function audit(
  action: AuditAction,
  {
    user,
    email,
    resourceType,
    resourceId,
    details,
  }: {
    user?: { id: number; email: string } | null;
    email?: string;
    resourceType?: string;
    resourceId?: number | string | null;
    details?: Record<string, unknown>;
  } = {},
) {
  run(
    `INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user?.id ?? null,
      user?.email ?? email ?? null,
      action,
      resourceType ?? null,
      resourceId === null || resourceId === undefined ? null : String(resourceId),
      details ? JSON.stringify(details) : null,
      await clientIp(),
      await userAgent(),
      now(),
    ],
  );
}
