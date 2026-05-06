import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { DesignsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface ViewDesignsInput {
    cursor?: UUID;
    limit?: number;
}
export type ViewDesignsOutput = DesignSummaryDto[];

@Injectable()
export class ViewDesignsUseCase implements UseCase<ViewDesignsInput, ViewDesignsOutput> {

    constructor(private readonly repository: DesignsRepository) {}

	// by: 'all' | 'inventory' | 'album',
    async execute({ cursor, limit }: ViewDesignsInput) {
        const designs = await this.repository.findAll({ cursor, limit });
        if (!designs) throw new AppException(404, 'NOT_FOUND');
        return designs;
    }
}