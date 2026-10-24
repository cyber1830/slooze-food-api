import { SetMetadata } from '@nestjs/common';
import { Role } from '../common/enums';

/** RBAC matrix from the assignment. One source of truth; resolvers reference actions by name. */
export const POLICY = {
  viewCatalog: [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  viewOrders: [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  createOrder: [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  placeOrder: [Role.ADMIN, Role.MANAGER],
  cancelOrder: [Role.ADMIN, Role.MANAGER],
  viewPayments: [Role.ADMIN, Role.MANAGER], // managers need to see methods to pay with them
  managePayments: [Role.ADMIN],
} as const;

export type Action = keyof typeof POLICY;

export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'isPublic';
export const Allow = (action: Action) => SetMetadata(ROLES_KEY, POLICY[action]);
export const Public = () => SetMetadata(PUBLIC_KEY, true);
