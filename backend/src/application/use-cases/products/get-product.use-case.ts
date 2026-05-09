import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { ProductsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetProductInput {
    id: UUID;
}
export interface GetProductOutput {
    user: UserDto;
}

@Injectable()
export class GetProductUseCase implements UseCase<GetProductInput, GetProductOutput> {

    constructor(private readonly repository: ProductsRepository) {}

    async execute(input: GetProductInput) {
        const user = await this.repository.findDtoById(input.id);
        if (!user) throw new AppException(404, 'NOT_FOUND');
        return { user };
    }
}