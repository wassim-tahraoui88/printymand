import { Module } from '@nestjs/common';
import { UsersRepository } from '../domain/repositories';
import { PostgresUsersRepository } from '../infrastructure/persistence/repositories';
import { RegisterUseCase, LoginUseCase, LogoutUseCase, RefreshUseCase } from '../application/use-cases/auth';
import { AuthController } from '../api/controllers/auth/auth.controller';

@Module({
    controllers: [AuthController],
    providers: [
        {
            provide: UsersRepository,
            useClass: PostgresUsersRepository
        },
        RegisterUseCase,
        LoginUseCase,
        LogoutUseCase,
        RefreshUseCase
    ]
})
export class AuthModule {}