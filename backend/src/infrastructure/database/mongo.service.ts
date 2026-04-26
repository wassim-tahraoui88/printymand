import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Db } from 'mongodb';
import { MONGO } from './constants';

@Injectable()
export class MongoService implements OnModuleDestroy {

    constructor(@Inject(MONGO) private readonly db: Db) {}

    collection(collectionName: string) {
        return this.db.collection(collectionName);
    }

    ping() {
        return this.db.command({ ping: 1 });
    }

    async onModuleDestroy() {
        await this.db.client.close();
    }
}