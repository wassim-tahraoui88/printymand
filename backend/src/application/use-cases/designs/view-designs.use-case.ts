import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface ViewDesignsInput {
    id: UUID;
}
export interface ViewDesignsOutput {
    user: UserDto;
}

@Injectable()
export class ViewDesignsUseCase implements UseCase<ViewDesignsInput, ViewDesignsOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: ViewDesignsInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}