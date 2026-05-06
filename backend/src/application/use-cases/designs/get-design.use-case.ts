import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetDesignInput {
    id: UUID;
}
export interface GetDesignOutput {
    user: UserDto;
}

@Injectable()
export class GetDesignUseCase implements UseCase<GetDesignInput, GetDesignOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: GetDesignInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}