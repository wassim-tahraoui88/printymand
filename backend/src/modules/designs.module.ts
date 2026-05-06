import { Module } from '@nestjs/common';
import { DesignsRepository } from '../domain/repositories';
import { PostgresDesignsRepository } from '../infrastructure/persistence/repositories';
import { } from '../application/use-cases/designs';
import { DesignsController } from '../api/controllers/designs/designs.controller';

@Module({
	controllers: [DesignsController],
	providers: [
		{
			provide: DesignsRepository,
			useClass: PostgresDesignsRepository
		},
	]
})
export class DesignsModule {}