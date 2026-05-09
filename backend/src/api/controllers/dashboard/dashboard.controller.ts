import { Controller, Get } from '@nestjs/common';
import { GetDashboardDataUseCase } from '../../../application/use-cases/dashboard';

@Controller('dashboard')
export class DashboardController {

	constructor(private readonly getDashboardData: GetDashboardDataUseCase) {}

	@Get()
	onGetDashboardData() {
		return this.getDashboardData.execute({});
	}
}