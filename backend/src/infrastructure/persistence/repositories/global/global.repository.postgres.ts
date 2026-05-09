import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { GlobalRepository } from '../../../../domain/repositories';
import { FIND_SIMPLE_USER_BY_ID } from './queries';

@Injectable()
export class PostgresGlobalRepository implements GlobalRepository {

    constructor(private readonly db: PostgresService) {}

    async findSimpleUserById(id: UUID): Promise<UserSummaryDto | null> {
        const result = await this.db.query(FIND_SIMPLE_USER_BY_ID, [id]);
        return PostgresUtils.getFirst<UserSummaryDto>(result);
    }


}