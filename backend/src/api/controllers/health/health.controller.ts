import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PostgresHealthIndicator, MongoHealthIndicator, WebSocketHealthIndicator } from '../../../infrastructure/health';
import { JwtGuard, RolesGuard } from '../../guards';
import { Roles } from '../../decorators';

@Controller('health')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
export class HealthController {

    private static readonly BUILD_VERSION = `1.0.0`;
    private static readonly BUILD_DESCRIPTION = `Initial release`;

    constructor(private health: HealthCheckService,
                private memory: MemoryHealthIndicator,
                private postgres: PostgresHealthIndicator,
                private mongo: MongoHealthIndicator,
                private ws: WebSocketHealthIndicator) {}

    @Get() @HealthCheck() @HttpCode(HttpStatus.OK)
    async healthCheck() {
        const result = await this.health.check([
            () => this.memory.checkHeap('Heap Memory', 150 * 1024 * 1024),
            () => this.postgres.check('Postgres'),
            () => this.mongo.check('MongoDB'),
            () => this.ws.check('WebSocket'),
        ]);
        return {
            build: {
                version: HealthController.BUILD_VERSION,
                description: HealthController.BUILD_DESCRIPTION,
            },
            ...result.info,
        };
    }
}