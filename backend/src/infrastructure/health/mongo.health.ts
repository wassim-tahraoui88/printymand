import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { MongoService } from '../database/mongo.service';

@Injectable()
export class MongoHealthIndicator {

    constructor(private readonly healthIndicatorService: HealthIndicatorService,
                private readonly mongo: MongoService) {}

    async check(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key);
        try {
            await this.mongo.ping();
            return indicator.up();
        }
        catch (error) {
            return indicator.down({ error })
        }
    }
}