import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { transactionStore } from './transaction.context';
import { POSTGRES } from '../constants';

@Injectable()
export class TransactionScope {

    constructor(@Inject(POSTGRES) private readonly pool: Pool) {}

    async run<T>(callback: () => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await transactionStore.run(client, async () => callback());
            await client.query('COMMIT');
            return result;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
}