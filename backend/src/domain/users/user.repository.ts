import { User } from './user.entity';
import { PostgresService } from '../../infrastructure/database/postgres.service';
import { INSERT_USER } from './queries';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {

    constructor(private readonly db: PostgresService) {}

    async create(user: User) {
        const result = await this.db.query(INSERT_USER, [user.username, user.passwordHash, user.firstName, user.lastName, user.phoneNumber, user.avatarUrl, user.status, user.createdAt]);
        if (result.rowCount === 0) throw new Error('Failed to create user');
        user.id = result.rows[0].id;
        return user.id;
    }

    async existsByUsername(username: string): Promise<boolean> {
        const result = await this.db.query('SELECT 1 FROM users WHERE username = $1', [username]);
        return !!result.rowCount && result.rowCount > 0;
    }

    async findByUsername(username: string) {
        const result = await this.db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rowCount === 0) return null;
        const row = result.rows[0];
        return { id: row.id, passwordHash: row.password_hash, role: row.role, status: row.status };
    }
    async findDtoById(id: number) {
        const result = await this.db.query(`SELECT id, username, first_name, last_name, phone_number, avatar_url, role, status, created_at FROM users WHERE id = $1`, [id]);
        if (result.rowCount === 0) return null;
        return result.rows[0];
    }
}