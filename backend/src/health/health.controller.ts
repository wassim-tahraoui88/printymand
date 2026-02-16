import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {

    private static readonly BUILD_VERSION = 0;
    private static readonly BUILD_CHECKPOINT = `Logout Refactoring.`;

    constructor(private health: HealthCheckService,
                private memory: MemoryHealthIndicator) {}

    @Get() @HealthCheck() @HttpCode(HttpStatus.OK)
    async healthCheck() {
        const result = await this.health.check([
            // () => this.mongoose.pingCheck('mongoose'),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        ]);
        return {
            build: {
                version: HealthController.BUILD_VERSION,
                checkpoint: HealthController.BUILD_CHECKPOINT,
            },
            ...result.info,
        };
    }
}