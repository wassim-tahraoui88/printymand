import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { ProductsRepository } from '../../../../domain/repositories';
import { FIND_ALL, FIND_BY_ID, INSERT_PRODUCT } from './queries';

@Injectable()
export class PostgresProductsRepository implements ProductsRepository {

    constructor(private readonly db: PostgresService) {}

    async create(dto: CreateProductDto) {
        await this.db.query(INSERT_PRODUCT, [/* params placeholder */]);
    }

	async findDtoById(id: UUID) {
		const result = await this.db.query(FIND_BY_ID, [id]);
		return PostgresUtils.getFirst<ProductDto>(result);
	}

	async findAll(): Promise<ProductDto[]> {
		const result = await this.db.query(FIND_ALL, [/* params placeholder */]);
		return PostgresUtils.getAll<ProductDto>(result);
	}

}