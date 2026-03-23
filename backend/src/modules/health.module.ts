import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '../api/controllers/health/health.controller';
import { PostgresHealthIndicator, MongoHealthIndicator, WebSocketHealthIndicator } from '../infrastructure/health';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [PostgresHealthIndicator, MongoHealthIndicator, WebSocketHealthIndicator]
})
export class HealthModule {}