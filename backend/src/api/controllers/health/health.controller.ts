import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PostgresHealthIndicator } from '../../../infrastructure/health';
import { JwtGuard, RbacGuard } from '../../guards';
import { Roles } from '../../decorators';

@Controller('health')
@UseGuards(JwtGuard, RbacGuard)
@Roles('ADMIN')
export class HealthController {

    private static readonly BUILD_VERSION = `1.0.0`;
    private static readonly BUILD_DESCRIPTION = `Initial release`;

    constructor(private health: HealthCheckService,
                private memory: MemoryHealthIndicator,
                private postgres: PostgresHealthIndicator) {}

    @Get() @HealthCheck() @HttpCode(HttpStatus.OK)
    async healthCheck() {
        const result = await this.health.check([
            () => this.memory.checkHeap('Heap Memory', 150 * 1024 * 1024),
            () => this.postgres.check('Postgres'),
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