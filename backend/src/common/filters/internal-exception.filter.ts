import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { InternalException } from './internal.exception';

@Catch(InternalException)
export class InternalExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(InternalExceptionFilter.name);

    catch(exception: InternalException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        this.logger.error(`Internal Exception: [500] ${ exception.message }`);
        response.status(500).json({ success: false, message: exception.message });
    }
}
