import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { DesignsRepository } from '../../../../domain/repositories';
import { FIND_AUTH_BY_USERNAME, FIND_BY_ID, INSERT_USER } from './queries';

@Injectable()
export class PostgresDesignsRepository implements DesignsRepository {

    constructor(private readonly db: PostgresService) {}

    async create(dto: CreateDesignDto) {
        await this.db.query(INSERT_USER, [dto.id, dto.username, dto.passwordHash, dto.firstName, dto.lastName, dto.phoneNumber]);
    }

	async findDtoById(id: UUID) {
		const result = await this.db.query(FIND_BY_ID, [id]);
		return PostgresUtils.getFirst<UserDto>(result);
	}
    async findSummaryDtoById(id: UUID) {
        const result = await this.db.query(FIND_AUTH_BY_USERNAME, [id]);
        return PostgresUtils.getFirst<DesignSummaryDto>(result);
    }

	async findAll({ cursor, limit }: { cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null> {
		const result = await this.db.query(FIND_AUTH_BY_USERNAME, [cursor, limit ?? 25]);
		return PostgresUtils.getAll<DesignSummaryDto>(result);
	}
}