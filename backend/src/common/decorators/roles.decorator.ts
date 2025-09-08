import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = string;

/**
 * Roles decorator to protect routes by role.
 * Usage: `@Roles('admin')`
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
