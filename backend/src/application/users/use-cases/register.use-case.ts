import { Injectable } from '@nestjs/common';
import { UseCase } from '../../use-case';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { UserRepository } from '../../../domain/users/user.repository';
import { User } from '../../../domain/users/user.entity';
import { PasswordPolicy } from '../../../domain/users/policies/password.policy';
import { AppException } from '../../../shared/exceptions/app.exception';

interface RegisterInput {
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
}
export interface RegisterOutput {
    token: string;
}

@Injectable()
export class RegisterUseCase implements UseCase<RegisterInput, RegisterOutput> {

    constructor(private readonly repository: UserRepository, private readonly jwtService: JwtService) {}

    async execute(input: RegisterInput) {
        const existing = await this.repository.existsByUsername(input.username);
        if (existing) throw new AppException(409, 'ALREADY_EXISTS');

        const passwordHash = await PasswordPolicy.hash(input.password);
        const user = new User(null, input.username, passwordHash, input.firstName, input.lastName, input.phoneNumber, '', 'USER','ACTIVE', new Date());

        user.id = await this.repository.create(user);
        return { token: this.jwtService.sign({ sub: user.id, role: user.role, status: user.status }) };
    }
}