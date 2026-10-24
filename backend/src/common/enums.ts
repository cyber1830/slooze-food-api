import { registerEnumType } from '@nestjs/graphql';

export enum Role { ADMIN = 'ADMIN', MANAGER = 'MANAGER', MEMBER = 'MEMBER' }
export enum Country { INDIA = 'INDIA', AMERICA = 'AMERICA' }
export enum OrderStatus { DRAFT = 'DRAFT', PLACED = 'PLACED', CANCELLED = 'CANCELLED' }

registerEnumType(Role, { name: 'Role' });
registerEnumType(Country, { name: 'Country' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
