import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtUtils } from '../../auth/jwt/jwt.utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        if (status === 401) {
            JwtUtils.clearCookie(response);
            this.logger.debug(`Cleared auth cookie due to 401 Unauthorized response.`);
        }

        this.logger.error(`${request.method} ${request.url} - HTTP Exception: [${status}] ${ exception.message }`);
        response.status(status).json({ success: false, message: exception.message });
    }
}
