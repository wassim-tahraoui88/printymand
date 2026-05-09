import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface RefreshInput {
    id: UUID;
}
export interface RefreshOutput {
    user: UserDto;
}

@Injectable()
export class RefreshUseCase implements UseCase<RefreshInput, RefreshOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: RefreshInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}