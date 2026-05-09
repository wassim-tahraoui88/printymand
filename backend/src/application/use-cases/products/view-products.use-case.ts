import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { ProductsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface ViewProductsInput {
    cursor?: UUID;
    limit?: number;
}
export type ViewProductsOutput = any;

@Injectable()
export class ViewProductsUseCase implements UseCase<ViewProductsInput, ViewProductsOutput> {

    constructor(private readonly repository: ProductsRepository) {}

    async execute(input: ViewProductsInput) {
		return this.repository.findAll();
    }
}