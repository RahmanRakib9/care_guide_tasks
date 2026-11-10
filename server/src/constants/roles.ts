export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: [string, ...string[]] = [ROLES.USER, ROLES.ADMIN];
