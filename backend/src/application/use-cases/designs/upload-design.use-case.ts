import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { DesignsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';
import { EntityId } from "../../../domain/value-objects/domain.id";

interface UploadDesignInput {
    userId: UUID;
}
export type UploadDesignOutput = void;

@Injectable()
export class UploadDesignUseCase implements UseCase<UploadDesignInput, UploadDesignOutput> {

    constructor(private readonly repository: DesignsRepository) {}

    async execute(input: UploadDesignInput) {
		const id = EntityId.generate().value;
        // await this.repository.create({ id, ...input });
    }
}