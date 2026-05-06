import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface UploadDesignInput {
    id: UUID;
}
export interface UploadDesignOutput {
    user: UserDto;
}

@Injectable()
export class UploadDesignUseCase implements UseCase<UploadDesignInput, UploadDesignOutput> {

    constructor(private readonly repository: UsersRepository) {}

    async execute(input: UploadDesignInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}