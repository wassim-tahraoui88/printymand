import { Module } from '@nestjs/common';
import { DesignsRepository } from '../domain/repositories';
import { PostgresDesignsRepository } from '../infrastructure/persistence/repositories';
import { ViewDesignsUseCase, GetDesignUseCase, GetUploadConfigUseCase, UploadDesignUseCase } from '../application/use-cases/designs';
import { DesignsController } from '../api/controllers/designs/designs.controller';

@Module({
	controllers: [DesignsController],
	providers: [
		{
			provide: DesignsRepository,
			useClass: PostgresDesignsRepository
		},
		ViewDesignsUseCase,
		GetDesignUseCase,
		GetUploadConfigUseCase,
		UploadDesignUseCase
	]
})
export class DesignsModule {}