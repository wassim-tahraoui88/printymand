import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionScope } from './postgres/transaction.scope';
import { PostgresService } from './postgres.service';
import { MongoService } from './mongo.service';
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { POSTGRES, MONGO } from './constants';

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
		{
			provide: MONGO,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService): Promise<Db> => {
				const client = new MongoClient(configService.get<string>('MONGODB_URL')!)
				await client.connect();
				return client.db(configService.get<string>('MONGODB_DB_NAME')!);
			}
		},
		TransactionScope,
		PostgresService,
		MongoService
	],
	exports: [
		TransactionScope,
		PostgresService,
		MongoService
	]
})
export class DatabaseModule {}