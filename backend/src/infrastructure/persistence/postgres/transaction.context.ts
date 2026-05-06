import { AsyncLocalStorage} from 'async_hooks';
import { PoolClient } from 'pg';
import { CommitSignal } from './transaction.utils';

export const transactionStore = new AsyncLocalStorage<{ client: PoolClient, commitSignal: CommitSignal }>();
export const getTransactionClient = (): PoolClient | null => {
    return transactionStore.getStore()?.client ?? null;
}
export const getTransactionSignal = (): CommitSignal | null => {
    return transactionStore.getStore()?.commitSignal ?? null;
}