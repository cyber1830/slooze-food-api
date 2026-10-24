import { BadRequestException, Injectable, Module, NotFoundException } from '@nestjs/common';
import { Args, Field, ID, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.module';
import { Allow } from '../auth/permissions';

@ObjectType()
export class PaymentMethod {
  @Field(() => ID) id: string;
  @Field() type: string;
  @Field() label: string;
  @Field() last4: string;
  @Field() isDefault: boolean;
}

@InputType()
export class PaymentMethodInput {
  @Field() type: string;
  @Field() label: string;
  @Field({ nullable: true }) last4?: string;
  @Field({ nullable: true }) isDefault?: boolean;
}

@InputType()
export class UpdatePaymentMethodInput {
  @Field({ nullable: true }) type?: string;
  @Field({ nullable: true }) label?: string;
  @Field({ nullable: true }) last4?: string;
  @Field({ nullable: true }) isDefault?: boolean;
}

const TYPES = ['CARD', 'UPI', 'PAYPAL'];

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private validate(i: { type?: string; label?: string; last4?: string }) {
    if (i.type !== undefined && !TYPES.includes(i.type)) throw new BadRequestException(`type must be one of ${TYPES.join(', ')}`);
    if (i.label !== undefined && !i.label.trim()) throw new BadRequestException('label cannot be empty');
    if (i.last4 && !/^\d{4}$/.test(i.last4)) throw new BadRequestException('last4 must be exactly 4 digits');
  }

  list(): Promise<any> {
    return this.prisma.paymentMethod.findMany({ orderBy: [{ isDefault: 'desc' }, { label: 'asc' }] });
  }

  async add(input: PaymentMethodInput): Promise<any> {
    this.validate(input);
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.paymentMethod.updateMany({ data: { isDefault: false } });
      return tx.paymentMethod.create({ data: { type: input.type, label: input.label.trim(), last4: input.last4 ?? '', isDefault: !!input.isDefault } });
    });
  }

  async update(id: string, input: UpdatePaymentMethodInput): Promise<any> {
    this.validate(input);
    const existing = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment method not found');
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.paymentMethod.updateMany({ data: { isDefault: false } });
      const { isDefault, type, label, last4 } = input;
      return tx.paymentMethod.update({ where: { id }, data: {
        ...(type != null && { type }), ...(label != null && { label: label.trim() }),
        ...(last4 != null && { last4 }), ...(isDefault != null && { isDefault }),
      } });
    });
  }
}

@Resolver(() => PaymentMethod)
export class PaymentsResolver {
  constructor(private svc: PaymentsService) {}

  @Allow('viewPayments')
  @Query(() => [PaymentMethod])
  paymentMethods() { return this.svc.list(); }

  @Allow('managePayments')
  @Mutation(() => PaymentMethod)
  addPaymentMethod(@Args('input') input: PaymentMethodInput) { return this.svc.add(input); }

  @Allow('managePayments')
  @Mutation(() => PaymentMethod)
  updatePaymentMethod(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdatePaymentMethodInput) {
    return this.svc.update(id, input);
  }
}

@Module({ providers: [PaymentsService, PaymentsResolver] })
export class PaymentsModule {}
