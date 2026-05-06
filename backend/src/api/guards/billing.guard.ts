import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PostgresService } from '../../infrastructure/persistence/postgres.service';

@Injectable()
export class BillingGuard implements CanActivate {

    constructor(private readonly db: PostgresService) {}

    async canActivate(context : ExecutionContext) : Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (request.user.role === 'ADMIN') return true;
	    return true;
    }
}