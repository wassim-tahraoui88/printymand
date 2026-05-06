import { Module } from '@nestjs/common';
import { OrdersRepository } from '../domain/repositories';
import { PostgresOrdersRepository } from '../infrastructure/persistence/repositories';
import { } from '../application/use-cases/orders';
import { OrdersController } from '../api/controllers/orders/orders.controller';

@Module({
    controllers: [OrdersController],
    providers: [
        {
            provide: OrdersRepository,
            useClass: PostgresOrdersRepository
        },
    ]
})
export class OrdersModule {}