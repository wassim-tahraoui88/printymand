import { Module } from '@nestjs/common';
import { UsersRepository } from '../domain/repositories';
import { PostgresUsersRepository } from '../infrastructure/persistence/repositories';
import { RefreshUseCase } from '../application/use-cases/users';
import { UsersController } from '../api/controllers/users/users.controller';

@Module({
    controllers: [UsersController],
    providers: [
	    {
			provide: UsersRepository,
		    useClass: PostgresUsersRepository,
	    },
        RefreshUseCase,
    ]
})
export class UsersModule {}