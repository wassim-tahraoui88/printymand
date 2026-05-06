import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { DesignsRepository } from '../../../../domain/repositories';
import {
	INSERT_DESIGN,
	FIND_BY_ID,
	FIND_ALL,
	FIND_SUMMARY_BY_ID,
	FIND_ALL_BY_INVENTORY,
	FIND_ALL_BY_ALBUM,
} from './queries';

@Injectable()
export class PostgresDesignsRepository implements DesignsRepository {

    constructor(private readonly db: PostgresService) {}

    async create(dto: CreateDesignDto) {
        await this.db.query(INSERT_DESIGN, [dto.id, dto.inventoryId, dto.albumId, dto.description, dto.displayUrl, dto.assetUrl]);
    }

	async findDtoById(id: UUID) {
		const result = await this.db.query(FIND_BY_ID, [id]);
		return PostgresUtils.getFirst<DesignDto>(result);
	}
    async findSummaryDtoById(id: UUID) {
        const result = await this.db.query(FIND_SUMMARY_BY_ID, [id]);
        return PostgresUtils.getFirst<DesignSummaryDto>(result);
    }

	async findAll({ cursor, limit }: { id: UUID, cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null> {
		const result = await this.db.query(FIND_ALL, [cursor, limit ?? 25]);
		return PostgresUtils.getAll<DesignSummaryDto>(result);
	}
	async findAllByInventory({ id, cursor, limit }: { id: UUID, cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null> {
		const result = await this.db.query(FIND_ALL_BY_INVENTORY, [id, cursor, limit ?? 25]);
		return PostgresUtils.getAll<DesignSummaryDto>(result);
	}
	async findAllByAlbum({ id, cursor, limit }: { id: UUID, cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null> {
		const result = await this.db.query(FIND_ALL_BY_ALBUM, [id, cursor, limit ?? 25]);
		return PostgresUtils.getAll<DesignSummaryDto>(result);
	}
}