import {ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import type {CanActivate, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {rolePermissions, users} from './authorization.policy';
import {PERMISSION_METADATA} from './authorization.types';
import type {AuthorizedRequest, Permission} from './authorization.types';

@Injectable()
export class AuthorizationGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthorizedRequest>();
        const identity = request.headers['x-user-id'];
        const user = typeof identity === 'string' ? users.get(identity.trim()) : undefined;
        if (!user) throw new UnauthorizedException('Missing or unrecognized user identity');
        const permission = this.reflector.getAllAndOverride<Permission>(PERMISSION_METADATA, [
            context.getHandler(), context.getClass(),
        ]);
        if (!permission) throw new ForbiddenException('Missing authorization for this endpoint');
        if (!rolePermissions[user.role].has(permission)) {
            throw new ForbiddenException("Missing authorization for '" + permission + "'");
        }
        request.currentUser = user;
        return true;
    }
}
