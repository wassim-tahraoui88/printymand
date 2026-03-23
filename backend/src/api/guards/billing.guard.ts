import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PostgresService } from '../../infrastructure/database/postgres.service';
import { AppException } from '../../shared/exceptions/app.exception';
import { MembershipRole } from '../../domain/users/user.entity';

const userPayingRoles = [
    MembershipRole.PARENT.valueOf() as IMembershipRole,
    MembershipRole.STUDENT.valueOf() as IMembershipRole
]

@Injectable()
export class BillingGuard implements CanActivate {

    constructor(private readonly db: PostgresService) {}

    async canActivate(context : ExecutionContext) : Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const membership = request.membership as IMembership;
        if (!membership) throw new AppException(401,'AUTH_INVALID_CREDENTIALS', { reason: 'MEMBERSHIP_MISSING' });

        if (request.user.role === 'ADMIN') return true;

        if (membership.billingModel === 'FREE') return true;
        else {
            if (membership.billingModel === 'USER_SUBSCRIPTION') {
                if (userPayingRoles.every(role => !membership.roles.includes(role))) return true;
                const { rowCount } = await this.db.query(`
                    SELECT 1 FROM user_subscriptions
                    WHERE user_id = $1 AND school_id = $2 AND end_date > NOW()
                `, [request.user.id, request.schoolId]);
                return !!rowCount && rowCount > 0;
            }
            else if (membership.billingModel === 'SCHOOL_LICENSE') {
                const { rowCount } = await this.db.query(`
                    SELECT 1 FROM school_licenses
                    WHERE school_id = $1 AND end_date > NOW()
                `, [request.schoolId]);
                return !!rowCount && rowCount > 0;
            }
            return false;
        }
    }
}