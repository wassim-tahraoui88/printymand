import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserStatus } from '../../domain/users/user.entity';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class StatusGuard implements CanActivate {

    canActivate(context : ExecutionContext) : boolean {
        const { user } : { user : { status: UserStatus } } = context.switchToHttp().getRequest();
        if (!user) throw new AppException(401,'NOT_AUTHENTICATED', { reason: 'TOKEN_MISSING' });
        if (user.status !== 'ACTIVE') throw new AppException(403, 'ACCOUNT_NOT_ACTIVE', { status: user.status });
        return true;
    }
}