import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../postgres.service';
import { PostgresUtils } from '../../postgres/postgres.utils';
import { UsersRepository } from '../../../../domain/repositories';
import { FIND_AUTH_BY_EMAIL, FIND_BY_ID, INSERT_USER } from './queries';

@Injectable()
export class PostgresUsersRepository implements UsersRepository {

    constructor(private readonly db: PostgresService) {}

    async create(user: CreateUserDto) {
        await this.db.query(INSERT_USER, [user.id, user.email, user.passwordHash, user.name, user.address, user.phoneNumber]);
    }
    async findByEmail(email: string) {
        const result = await this.db.query(FIND_AUTH_BY_EMAIL, [email]);
        return PostgresUtils.getFirst<UserAuthDto>(result);
    }
    async findDtoById(id: UUID) {
        const result = await this.db.query(FIND_BY_ID, [id]);
        return PostgresUtils.getFirst<UserDto>(result);
    }
}