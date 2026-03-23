import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import ms from 'ms';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class JwtService {

    private readonly secret: string;
    private readonly issuer: string;
    private readonly expiresIn: ms.StringValue;

    constructor(config: ConfigService) {
        this.secret = config.get<string>('JWT_SECRET')!;
        this.issuer = config.get<string>('JWT_ISSUER') || 'imtiyez-platform';
        this.expiresIn = (config.get<string>('JWT_EXPIRATION') || '14d') as ms.StringValue;
    }

    sign(payload: any): string {
        return jwt.sign(payload, this.secret, { issuer: this.issuer, expiresIn: this.expiresIn });
    }
    verify(token: string): JwtPayload & IPrincipal {
        const payload = jwt.verify(token, this.secret);
        if (typeof payload === 'string') throw new AppException(500,'INTERNAL_SERVER_ERROR', { message: 'Invalid token payload' });
        return payload as JwtPayload & IPrincipal;
    }
}