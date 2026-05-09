import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { ProductsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface AddProductInput {
    userId: UUID;
}
export type AddProductOutput = any;

@Injectable()
export class AddProductUseCase implements UseCase<AddProductInput, AddProductOutput> {

    constructor(private readonly repository: ProductsRepository) {}

    async execute(input: AddProductInput) {
		return this.repository.create(input);
    }
}