import type {ExecutionContext} from '@nestjs/common';
import {createParamDecorator, UnauthorizedException} from '@nestjs/common';
import type {AuthorizedRequest, ResolvedUser} from './authorization.types';

export function resolveCurrentUser(context: ExecutionContext): ResolvedUser {
    const user = context.switchToHttp().getRequest<AuthorizedRequest>().currentUser;
    if (!user) throw new UnauthorizedException('Missing or unrecognized user identity');
    return user;
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => resolveCurrentUser(context));
