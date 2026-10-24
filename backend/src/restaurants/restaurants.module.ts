import { Injectable, Module, NotFoundException } from '@nestjs/common';
import { Args, Field, Float, ID, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser } from '../auth/auth.guard';
import { Allow } from '../auth/permissions';
import { Country } from '../common/enums';
import { AuthUser, countryFilter } from '../common/scope';

@ObjectType()
export class MenuItem {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() description: string;
  @Field(() => Float) price: number;
}

@ObjectType()
export class Restaurant {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() cuisine: string;
  @Field(() => Country) country: Country;
  @Field(() => [MenuItem]) menuItems: MenuItem[];
}

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  list(user: AuthUser): Promise<any> {
    return this.prisma.restaurant.findMany({ where: countryFilter(user), include: { menuItems: true }, orderBy: { name: 'asc' } });
  }

  async one(user: AuthUser, id: string): Promise<any> {
    // A restaurant outside the caller's country is indistinguishable from one that doesn't exist.
    const r = await this.prisma.restaurant.findFirst({ where: { id, ...countryFilter(user) }, include: { menuItems: true } });
    if (!r) throw new NotFoundException('Restaurant not found');
    return r;
  }
}

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private svc: RestaurantsService) {}

  @Allow('viewCatalog')
  @Query(() => [Restaurant])
  restaurants(@CurrentUser() user: AuthUser) { return this.svc.list(user); }

  @Allow('viewCatalog')
  @Query(() => Restaurant)
  restaurant(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) { return this.svc.one(user, id); }
}

@Module({ providers: [RestaurantsService, RestaurantsResolver] })
export class RestaurantsModule {}
