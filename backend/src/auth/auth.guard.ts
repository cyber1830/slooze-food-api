import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.module';
import { PUBLIC_KEY, ROLES_KEY } from './permissions';

/** Global guard: authenticates every operation (unless @Public) and enforces @Allow(action) role checks. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) return true;

    const req = GqlExecutionContext.create(ctx).getContext().req;
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Missing access token');

    let payload: { sub: string };
    try { payload = await this.jwt.verifyAsync(token); } catch { throw new UnauthorizedException('Invalid or expired token'); }

    // Load fresh from DB so role/country changes apply immediately, not at token expiry.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User no longer exists');
    req.user = user;

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException(`Role ${user.role} is not allowed to perform this action`);
    }
    return true;
  }
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
  GqlExecutionContext.create(ctx).getContext().req.user);
