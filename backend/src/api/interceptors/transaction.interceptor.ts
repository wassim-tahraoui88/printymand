import { Injectable, NestInterceptor, CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { TransactionScope } from '../../infrastructure/persistence/postgres/transaction.scope';
import { Observable, from, lastValueFrom } from 'rxjs';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {

    constructor(private readonly transactionScope: TransactionScope) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return from(this.transactionScope.run(async () => {
            Logger.debug('Transaction started.','TransactionInterceptor');
            const handler = await lastValueFrom(next.handle());
            Logger.debug('Transaction ended.','TransactionInterceptor');
            return handler;
        }));
    }
}