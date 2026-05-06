import { Module } from '@nestjs/common';
import { CartRepository } from '../domain/repositories';
import { PostgresCartRepository } from '../infrastructure/persistence/repositories';
import { } from '../application/use-cases/cart';
import { CartController } from '../api/controllers/cart/cart.controller';

@Module({
    controllers: [CartController],
    providers: [
        {
            provide: CartRepository,
            useClass: PostgresCartRepository
        },
    ]
})
export class CartModule {}