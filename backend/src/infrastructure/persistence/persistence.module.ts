import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionScope } from './postgres/transaction.scope';
import { PostgresService } from './postgres.service';
import { Pool } from 'pg';
import { POSTGRES } from './constants';
import { GlobalRepository } from '../../domain/repositories';
import { PostgresGlobalRepository } from './repositories/global/global.repository.postgres';

@Global()
@Module({
    providers: [
        {
            provide: POSTGRES,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => new Pool({
                connectionString: configService.get<string>('POSTGRES_URL'),
                ssl: process.env.NODE_ENV?.trim() !== 'local',
            })
        },
        TransactionScope,
        PostgresService,
        {
            provide: GlobalRepository,
            useClass: PostgresGlobalRepository
        }
    ],
    exports: [
        TransactionScope,
        PostgresService,
        GlobalRepository
    ]
})
export class PersistenceModule {}