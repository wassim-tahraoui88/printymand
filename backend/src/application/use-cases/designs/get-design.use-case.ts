import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { DesignsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetDesignInput {
    id: UUID;
}
export type GetDesignOutput = DesignDto;

@Injectable()
export class GetDesignUseCase implements UseCase<GetDesignInput, GetDesignOutput> {

    constructor(private readonly repository: DesignsRepository) {}

    async execute(input: GetDesignInput) {
        const design = await this.repository.findDtoById(input.id);
        if (!design) throw new AppException(404, 'NOT_FOUND');
        return design;
    }
}