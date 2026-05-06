import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';
import { UsersRepository } from '../../../domain/repositories';
import { AppException } from '../../../shared/exceptions/app.exception';

interface GetUploadConfigInput {
	id: UUID;
}
export interface GetUploadConfigOutput {
	user: UserDto;
}

@Injectable()
export class GetUploadConfigUseCase implements UseCase<GetUploadConfigInput, GetUploadConfigOutput> {

	constructor(private readonly repository: UsersRepository) {}

	async execute(input: GetUploadConfigInput) {
		const user = await this.repository.findDtoById(input.id);
		if (!user) throw new AppException(404, 'NOT_FOUND');
		return { user };
	}
}