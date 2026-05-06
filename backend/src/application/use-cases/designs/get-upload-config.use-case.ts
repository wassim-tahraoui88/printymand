import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { DesignsRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetUploadConfigInput {
}
export type GetUploadConfigOutput = any;

@Injectable()
export class GetUploadConfigUseCase implements UseCase<GetUploadConfigInput, GetUploadConfigOutput> {

	constructor(private readonly repository: DesignsRepository) {}

	async execute(input: GetUploadConfigInput) {
		return {};
	}
}