import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../../shared/exceptions/app.exception';
import { v4 as uuid } from 'uuid';

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(AppExceptionFilter.name);

    catch(exception: AppException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const requestId = uuid();
        const timestamp = new Date().toISOString();
        const status = exception.getStatus();

        const errorResponse = exception.getResponse() as object;
        this.logger.error(`${request.method} ${request.url} - Exception [${status}]: ${ JSON.stringify({ ...errorResponse, requestId }) }`);
        return response.status(status).json({
            ...errorResponse,
            meta: {
                requestId,
                timestamp,
            }
        });
    }
}
