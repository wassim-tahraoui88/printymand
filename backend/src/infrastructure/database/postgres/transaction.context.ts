import { AsyncLocalStorage} from 'async_hooks';
import { PoolClient } from 'pg';

export const transactionStore = new AsyncLocalStorage<PoolClient>();
export const getTransactionClient = (): PoolClient | null => {
    return transactionStore.getStore() ?? null;
}