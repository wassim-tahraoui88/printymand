import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface AddProductInput {
    id: UUID;
}
export interface AddProductOutput {
    user: UserDto;
}

@Injectable()
export class AddProductUseCase implements UseCase<AddProductInput, AddProductOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: AddProductInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}