import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { OrdersRepository } from '../../../../domain/repositories';
import { FIND_AUTH_BY_USERNAME, FIND_BY_ID, INSERT_USER } from './queries';

@Injectable()
export class PostgresOrdersRepository implements OrdersRepository {

    constructor(private readonly db: PostgresService) {}

    async create(user: CreateUserDto) {
        await this.db.query(INSERT_USER, [user.id, user.username, user.passwordHash, user.firstName, user.lastName, user.phoneNumber]);
    }
    async findByUsername(username: string) {
        const result = await this.db.query(FIND_AUTH_BY_USERNAME, [username]);
        return PostgresUtils.getFirst<UserAuthDto>(result);
    }
    async findDtoById(id: UUID) {
        const result = await this.db.query(FIND_BY_ID, [id]);
        return PostgresUtils.getFirst<UserDto>(result);
    }
}