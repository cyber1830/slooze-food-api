import { BadRequestException, Injectable, Module, NotFoundException } from '@nestjs/common';
import { Args, Field, Float, ID, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser } from '../auth/auth.guard';
import { User } from '../auth/auth.models';
import { Allow } from '../auth/permissions';
import { Country, OrderStatus, Role } from '../common/enums';
import { AuthUser } from '../common/scope';
import { MenuItem, Restaurant } from '../restaurants/restaurants.module';
import { PaymentMethod } from '../payments/payments.module';

@ObjectType()
export class OrderItem {
  @Field(() => ID) id: string;
  @Field(() => Int) quantity: number;
  @Field(() => Float) unitPrice: number;
  @Field(() => MenuItem) menuItem: MenuItem;
}

@ObjectType()
export class Order {
  @Field(() => ID) id: string;
  @Field(() => OrderStatus) status: OrderStatus;
  @Field(() => Country) country: Country;
  @Field(() => Float) total: number;
  @Field() createdAt: Date;
  @Field({ nullable: true }) placedAt?: Date;
  @Field(() => User) user: User;
  @Field(() => Restaurant) restaurant: Restaurant;
  @Field(() => PaymentMethod, { nullable: true }) paymentMethod?: PaymentMethod;
  @Field(() => [OrderItem]) items: OrderItem[];
}

const INCLUDE = { items: { include: { menuItem: true }, orderBy: { id: 'asc' as const } }, restaurant: { include: { menuItems: true } }, user: true, paymentMethod: true };
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Visibility rules (RBAC + Re-BAC combined):
   *  ADMIN   -> every order, every country
   *  MANAGER -> every order in their country (so they can check out members' carts)
   *  MEMBER  -> only their own orders, in their country
   */
  private scope(user: AuthUser) {
    if (user.role === Role.ADMIN) return {};
    if (user.role === Role.MANAGER) return { country: user.country };
    return { userId: user.id, country: user.country };
  }

  list(user: AuthUser): Promise<any> {
    return this.prisma.order.findMany({ where: this.scope(user), include: INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  myCart(user: AuthUser): Promise<any> {
    return this.prisma.order.findFirst({ where: { userId: user.id, status: OrderStatus.DRAFT }, include: INCLUDE });
  }

  private async findScoped(user: AuthUser, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, ...this.scope(user) }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found'); // 404, not 403: don't leak other countries' order ids
    return order;
  }

  private async recalc(orderId: string): Promise<any> {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const total = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
    return this.prisma.order.update({ where: { id: orderId }, data: { total }, include: INCLUDE });
  }

  /** Add (delta > 0) or remove (delta < 0) units of a menu item in the caller's draft order. */
  async changeCartItem(user: AuthUser, menuItemId: string, delta: number): Promise<any> {
    if (!Number.isInteger(delta) || delta === 0) throw new BadRequestException('delta must be a non-zero integer');
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id: menuItemId }, include: { restaurant: true } });
    if (!menuItem || (user.role !== Role.ADMIN && menuItem.restaurant.country !== user.country)) {
      throw new NotFoundException('Menu item not found');
    }

    let cart = await this.prisma.order.findFirst({ where: { userId: user.id, status: OrderStatus.DRAFT }, include: { items: true } });
    if (cart && cart.restaurantId !== menuItem.restaurantId) {
      if (cart.items.length) throw new BadRequestException('Your cart has items from another restaurant. Clear it or place that order first.');
      await this.prisma.order.delete({ where: { id: cart.id } });
      cart = null;
    }
    if (!cart) {
      if (delta < 0) throw new BadRequestException('Item is not in your cart');
      cart = await this.prisma.order.create({
        data: { userId: user.id, restaurantId: menuItem.restaurantId, country: menuItem.restaurant.country },
        include: { items: true },
      });
    }

    const line = cart.items.find((i) => i.menuItemId === menuItemId);
    const qty = (line?.quantity ?? 0) + delta;
    if (qty <= 0) {
      if (line) await this.prisma.orderItem.delete({ where: { id: line.id } });
    } else if (line) {
      await this.prisma.orderItem.update({ where: { id: line.id }, data: { quantity: qty } });
    } else {
      await this.prisma.orderItem.create({ data: { orderId: cart.id, menuItemId, quantity: qty, unitPrice: menuItem.price } });
    }
    return this.recalc(cart.id);
  }

  async place(user: AuthUser, orderId: string, paymentMethodId: string): Promise<any> {
    const order = await this.findScoped(user, orderId);
    if (order.status !== OrderStatus.DRAFT) throw new BadRequestException(`Order is already ${order.status.toLowerCase()}`);
    if (!order.items.length) throw new BadRequestException('Cannot check out an empty order');
    const pm = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!pm) throw new NotFoundException('Payment method not found');
    // Payment is simulated: a real integration would charge  here and only then flip the status.
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PLACED, paymentMethodId, placedAt: new Date() },
      include: INCLUDE,
    });
  }

  async cancel(user: AuthUser, orderId: string): Promise<any> {
    const order = await this.findScoped(user, orderId);
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Order is already cancelled');
    return this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED }, include: INCLUDE });
  }
}

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private svc: OrdersService) {}

  @Allow('viewOrders')
  @Query(() => [Order])
  orders(@CurrentUser() user: AuthUser) { return this.svc.list(user); }

  @Allow('createOrder')
  @Query(() => Order, { nullable: true })
  myCart(@CurrentUser() user: AuthUser) { return this.svc.myCart(user); }

  @Allow('createOrder')
  @Mutation(() => Order)
  changeCartItem(@CurrentUser() user: AuthUser, @Args('menuItemId', { type: () => ID }) menuItemId: string, @Args('delta', { type: () => Int }) delta: number) {
    return this.svc.changeCartItem(user, menuItemId, delta);
  }

  @Allow('placeOrder')
  @Mutation(() => Order)
  placeOrder(@CurrentUser() user: AuthUser, @Args('orderId', { type: () => ID }) orderId: string, @Args('paymentMethodId', { type: () => ID }) paymentMethodId: string) {
    return this.svc.place(user, orderId, paymentMethodId);
  }

  @Allow('cancelOrder')
  @Mutation(() => Order)
  cancelOrder(@CurrentUser() user: AuthUser, @Args('orderId', { type: () => ID }) orderId: string) {
    return this.svc.cancel(user, orderId);
  }
}

@Module({ providers: [OrdersService, OrdersResolver] })
export class OrdersModule {}
