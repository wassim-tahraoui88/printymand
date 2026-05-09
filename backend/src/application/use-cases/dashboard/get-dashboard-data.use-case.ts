import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { DashboardRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetDashboardDataInput {}
export type GetDashboardDataOutput = any;

@Injectable()
export class GetDashboardDataUseCase implements UseCase<GetDashboardDataInput, GetDashboardDataOutput> {

    constructor(private readonly repository: DashboardRepository) {}

    async execute(input: GetDashboardDataInput) {
        // Get various stats and information for dashboard page
    }
}