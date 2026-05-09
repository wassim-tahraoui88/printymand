import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '../api/controllers/health/health.controller';
import { PostgresHealthIndicator } from '../infrastructure/health';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [PostgresHealthIndicator]
})
export class HealthModule {}