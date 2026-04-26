import { Injectable } from '@nestjs/common';
import { UseCase } from '../../use-case';
import { UserRepository } from '../../../domain/users/user.repository';
import { AppException } from '../../../shared/exceptions/app.exception';

interface RefreshInput {
    id: number;
}
export interface RefreshOutput {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatarUrl: string;
    role: string;
    status: string;
    createdAt: Date;
}

@Injectable()
export class RefreshUseCase implements UseCase<RefreshInput, RefreshOutput> {

    constructor(private readonly repository: UserRepository) {}

    async execute(input: RefreshInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            avatarUrl: user.avatar_url,
            role: user.role,
            status: user.status,
            createdAt: user.created_at
        };
    }
}