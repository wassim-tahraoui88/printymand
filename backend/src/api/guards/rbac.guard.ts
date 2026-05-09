import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { Role } from '../../domain/entities';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class RbacGuard implements CanActivate {

    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const { user } : { user: IPrincipal } = context.switchToHttp().getRequest();
        if (!user) throw new AppException(401,'NOT_AUTHENTICATED', { reason: 'TOKEN_MISSING' });
        const classRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getClass()) || [];
        const methodRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler()) || [];
        return user.role === 'ADMIN' || [...classRoles, ...methodRoles].includes(user.role);
    }
}
