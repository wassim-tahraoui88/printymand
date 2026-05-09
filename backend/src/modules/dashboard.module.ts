import { Module } from '@nestjs/common';
import { DashboardRepository } from '../domain/repositories';
import { PostgresDashboardRepository } from '../infrastructure/persistence/repositories';
import { GetDashboardDataUseCase } from '../application/use-cases/dashboard';
import { DashboardController } from '../api/controllers/dashboard/dashboard.controller';

@Module({
    controllers: [DashboardController],
    providers: [
        {
            provide: DashboardRepository,
            useClass: PostgresDashboardRepository
        },
	    GetDashboardDataUseCase
    ]
})
export class DashboardModule {}