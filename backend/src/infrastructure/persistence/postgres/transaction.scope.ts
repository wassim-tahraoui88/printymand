import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { transactionStore } from './transaction.context';
import { CommitSignal } from './transaction.utils';
import { POSTGRES } from '../constants';

@Injectable()
export class TransactionScope {

    constructor(@Inject(POSTGRES) private readonly pool: Pool) {}

    async run<T>(callback: () => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        const commitSignal = CommitSignal.create();
        let resultHandler!: Promise<T>;
        try {
            await client.query('BEGIN');
            transactionStore.run({ client, commitSignal }, () => resultHandler = Promise.resolve().then(callback));
            const first = await Promise.race([
                resultHandler.then(() => 'handler-finished' as const),
                commitSignal.waitForCommitRequest().then(() => 'commit-requested' as const),
            ]);

            if (first === 'commit-requested') {
                await client.query('COMMIT');
                commitSignal.markCommitted();
                return await resultHandler;
            }
            await client.query('COMMIT');
            commitSignal.markCommitted();
            return await resultHandler;
        }
        catch (err) {
            try {
                await client.query('ROLLBACK');
            }
            finally {
                commitSignal.markCommitFailed(err);
            }
            throw err;
        }
        finally {
            client.release();
        }
    }
}