import { Injectable, ValidationPipe } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class GlobalHttpValidationPipe extends ValidationPipe {

    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors) => new AppException(400, 'BAD_REQUEST', {
                errors: errors
                    .map(err => Object.values(err.constraints || {}).join(', '))
                    .join('; ')
            })
        });
    }
}

@Injectable()
export class GlobalWsValidationPipe extends ValidationPipe {

    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors) => new WsException(new AppException(400, 'BAD_REQUEST', {
                errors: errors
                    .map(err => Object.values(err.constraints || {}).join(', '))
                    .join('; '),
            }))
        });
    }
}
