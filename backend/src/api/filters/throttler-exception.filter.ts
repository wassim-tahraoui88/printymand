import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(ThrottlerExceptionFilter.name);

    catch(exception: ThrottlerException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const message = `Throttler limit reached for IP: ${request.ip} on route: ${request.method} ${request.url}`;

        this.logger.warn(message);

        response.status(status).json({
            statusCode: status,
            message: 'Too Many Requests',
        });
    }
}
