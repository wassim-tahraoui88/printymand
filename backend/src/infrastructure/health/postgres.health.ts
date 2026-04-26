import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { PostgresService } from '../database/postgres.service';

@Injectable()
export class PostgresHealthIndicator {

    constructor(private readonly healthIndicatorService: HealthIndicatorService,
                private readonly postgres: PostgresService) {}

    async check(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key);
        try {
            await this.postgres.query('SELECT 1');
            return indicator.up();
        }
        catch (error) {
            return indicator.down({ error })
        }
    }
}