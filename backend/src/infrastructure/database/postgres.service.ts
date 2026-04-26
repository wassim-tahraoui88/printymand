import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { getTransactionClient } from './postgres/transaction.context';
import { POSTGRES } from './constants';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class PostgresService implements OnModuleDestroy {

    constructor(@Inject(POSTGRES) private readonly pool: Pool) {}

    async query(text: string, params?: any[], forcedPool = false): Promise<QueryResult> {
        try {
            const txClient = getTransactionClient();
            const executor = forcedPool ? this.pool : txClient ?? this.pool;
            return await executor.query(text, params);
        }
        catch (error) {
            throw new AppException(500, 'DATABASE_ERROR', { message: error?.message });
        }
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
}