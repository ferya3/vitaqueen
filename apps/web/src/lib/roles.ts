/**
 * Role-based access control.
 *
 * Roles are ordered by power, and every check asks "at least X" rather than
 * comparing names, so adding a role later means touching this file only.
 *
 *   content_manager   writes and edits content and uploads media
 *   editor            + publishes, deletes, and reads enquiries
 *   admin             + manages users, deletes enquiries, reads the audit log
 *   super_admin       + manages admins and deletes accounts
 */
export const ROLE_LEVEL = {
  content_manager: 10,
  editor: 20,
  admin: 30,
  super_admin: 40,
} as const;

export type Role = keyof typeof ROLE_LEVEL;

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'مدیر ارشد',
  admin: 'مدیر',
  editor: 'ویراستار',
  content_manager: 'مدیر محتوا',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && value in ROLE_LEVEL;
}

export function atLeast(role: Role, minimum: Role) {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimum];
}

/** Roles that may not use the panel at all without a confirmed second factor. */
export function requiresTwoFactor(role: Role) {
  return atLeast(role, 'editor');
}

export const can = {
  editContent: (role: Role) => atLeast(role, 'content_manager'),
  publish: (role: Role) => atLeast(role, 'editor'),
  deleteContent: (role: Role) => atLeast(role, 'editor'),
  readMessages: (role: Role) => atLeast(role, 'editor'),
  deleteMessages: (role: Role) => atLeast(role, 'admin'),
  manageUsers: (role: Role) => atLeast(role, 'admin'),
  readAudit: (role: Role) => atLeast(role, 'admin'),
  deleteUsers: (role: Role) => role === 'super_admin',
};
