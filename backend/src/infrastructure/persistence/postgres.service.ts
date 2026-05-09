import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult, types } from 'pg';
import { getTransactionClient } from './postgres/transaction.context';
import { POSTGRES } from './constants';
import { PostgresUtils } from './postgres/postgres.utils';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {

    constructor(@Inject(POSTGRES) private readonly pool: Pool) {}

    async query(text: string, params?: any[], forcedPool = false): Promise<QueryResult> {
        try {
            const txClient = getTransactionClient();
            const executor = forcedPool ? this.pool : txClient ?? this.pool;
            return await executor.query(text, params);
        }
        catch (err) {
            throw PostgresUtils.mapError(err);
        }
    }

    onModuleInit() {
        types.setTypeParser(1184, (value) => value === null ? null : new Date(value));
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
}