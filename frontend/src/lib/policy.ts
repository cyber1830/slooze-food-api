export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type Country = 'INDIA' | 'AMERICA';
export interface User { id: string; name: string; email: string; role: Role; country: Country }

/** Mirror of the server's RBAC matrix. UI only: it hides controls, the API is what actually enforces. */
export const POLICY = {
  viewCatalog: ['ADMIN', 'MANAGER', 'MEMBER'],
  viewOrders: ['ADMIN', 'MANAGER', 'MEMBER'],
  createOrder: ['ADMIN', 'MANAGER', 'MEMBER'],
  placeOrder: ['ADMIN', 'MANAGER'],
  cancelOrder: ['ADMIN', 'MANAGER'],
  viewPayments: ['ADMIN', 'MANAGER'],
  managePayments: ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;
export type Action = keyof typeof POLICY;

export const money = (n: number, country: Country) => `${country === 'INDIA' ? '₹' : '$'}${n.toFixed(2)}`;
