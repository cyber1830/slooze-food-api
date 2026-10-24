import { Injectable, Module, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { AuthGuard, CurrentUser } from './auth.guard';
import { AuthPayload, User } from './auth.models';
import { Public } from './permissions';
import { AuthUser } from '../common/scope';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Same error for unknown email and wrong password: don't reveal which accounts exist.
    if (!user || !(await compare(password, user.password))) throw new UnauthorizedException('Invalid email or password');
    return { accessToken: await this.jwt.signAsync({ sub: user.id }), user: user as any };
  }
}

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload)
  login(@Args('email') email: string, @Args('password') password: string) {
    return this.auth.login(email, password);
  }

  @Query(() => User)
  me(@CurrentUser() user: AuthUser) {
    return user as any;
  }
}

@Module({
  imports: [JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret', signOptions: { expiresIn: '8h' } })],
  providers: [AuthService, AuthResolver, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
