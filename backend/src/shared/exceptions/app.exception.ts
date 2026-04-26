import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {

    constructor(status: HttpStatus, public readonly code: ErrorCode, details?: Record<string, any>) {
        super({ code, details }, status);
    }
}
