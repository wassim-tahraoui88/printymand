import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface ViewProductsInput {
    id: UUID;
}
export interface ViewProductsOutput {
    user: UserDto;
}

@Injectable()
export class ViewProductsUseCase implements UseCase<ViewProductsInput, ViewProductsOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: ViewProductsInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}