import { Module } from '@nestjs/common';
import { ProductsRepository } from '../domain/repositories';
import { PostgresProductsRepository } from '../infrastructure/persistence/repositories';
import { } from '../application/use-cases/products';
import { ProductsController } from '../api/controllers/products/products.controller';

@Module({
	controllers: [ProductsController],
	providers: [
		{
			provide: ProductsRepository,
			useClass: PostgresProductsRepository
		},
	]
})
export class ProductsModule {}