import { Injectable } from '@nestjs/common';
import { UseCase } from '../../use-case';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { UserRepository } from '../../../domain/users/user.repository';
import { PasswordPolicy } from '../../../domain/users/policies/password.policy';
import { AppException } from '../../../shared/exceptions/app.exception';

interface LoginInput {
    username: string,
    password: string,
}
export interface LoginOutput {
    token: string;
}

@Injectable()
export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {

    constructor(private readonly repository: UserRepository, private readonly jwtService: JwtService) {}

    async execute(input: LoginInput) {
        const user = await this.repository.findByUsername(input.username);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        const authenticated = await PasswordPolicy.verify(input.password, user.passwordHash);
        if (!authenticated) throw new AppException(401,'AUTH_INVALID_CREDENTIALS');
        return { token: this.jwtService.sign({ sub: user.id, role: user.role, status: user.status }) };
    }
}