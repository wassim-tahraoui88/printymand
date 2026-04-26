import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
// import { JwtUtils } from '../../../auth/jwt/jwt.utils';

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const requestId = uuid();
        const timestamp = new Date().toISOString();
        const status = (exception as any)?.status ?? response.statusCode;

        if (status < 500) {
            if (status === HttpStatus.UNAUTHORIZED) {
                // JwtUtils.clearCookie(response);
                this.logger.error(`${request.method} ${request.url} - Exception [${status}]: ${ JSON.stringify({ requestId }) }`);
                return response.status(status).json({
                    meta: {
                        requestId,
                        timestamp,
                    }
                });
            }
        }

        this.logger.error(`${request.method} ${request.url} - Exception [500]: ${ (exception as any)?.message }`);
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR' as ErrorCode,
                message: 'An unexpected error occurred.'
            },
            meta: {
                requestId,
                timestamp,
            }
        });
    }
}
