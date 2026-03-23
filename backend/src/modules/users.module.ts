import { Module } from '@nestjs/common';
import { UserRepository } from '../domain/users/user.repository';
import { RegisterUseCase, LoginUseCase, RefreshUseCase } from '../application/users/use-cases';
import { UsersController } from '../api/controllers/users/users.controller';

@Module({
    controllers: [UsersController],
    providers: [
        UserRepository,
        RegisterUseCase,
        LoginUseCase,
        RefreshUseCase,
    ]
})
export class UsersModule {}