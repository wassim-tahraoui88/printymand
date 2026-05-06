import { Injectable } from '@nestjs/common';
import { UseCase } from '../use-case';

interface LogoutInput {
    id: UUID;
}
export type LogoutOutput = void;

@Injectable()
export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {

    constructor() {}

    execute(input: LogoutInput) {}
}