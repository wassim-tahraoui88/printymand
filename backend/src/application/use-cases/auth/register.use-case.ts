import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { UsersRepository } from '../../../domain/repositories';
import { PasswordPolicy } from '../../../domain/policies/users/password.policy';
import { EntityId } from '../../../domain/value-objects/domain.id';

interface RegisterInput {
    email: string,
    password: string,
    name: string,
    address: string,
    phoneNumber: string,
    role: 'PRINTER' | 'DESIGNER' | 'CUSTOMER',
}
export interface RegisterOutput {
    token: string;
}

@Injectable()
export class RegisterUseCase implements UseCase<RegisterInput, RegisterOutput> {

    constructor(private readonly repository: UsersRepository, private readonly jwtService: JwtService) {}

    async execute(input: RegisterInput) {
        const id = EntityId.generate().value;
        const passwordHash = await PasswordPolicy.hash(input.password);
        await this.repository.create({ id: id, ...input, passwordHash });
        return { token: this.jwtService.sign({ sub: id, role: 'USER', status: 'PENDING' }) };
    }
}