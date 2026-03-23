import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HEADER_AUTH_TOKEN, KEY_PLACEHOLDER } from '../../shared';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class JwtGuard implements CanActivate {

    private static readonly BLACKLIST_KEY = `BLACKLIST:${KEY_PLACEHOLDER}`;
    private static readonly BLACKLIST_VALUE = 1;

    constructor(private readonly jwtService: JwtService, @Inject(CACHE_MANAGER) private cache : Cache) {}

    private extractToken(req: Request): string | null {
        if (req.cookies && req.cookies[HEADER_AUTH_TOKEN]) return req.cookies[HEADER_AUTH_TOKEN];
        if (req.headers && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
        }
        return null;
    }
    private async isTokenBlacklisted(token: string) : Promise<boolean> {
        const key = JwtGuard.BLACKLIST_KEY.replace(KEY_PLACEHOLDER, token);
        const result = await this.cache.get(key);
        return result === JwtGuard.BLACKLIST_VALUE;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request as Request);
        if (!token) throw new AppException(401,'NOT_AUTHENTICATED', { reason: 'TOKEN_MISSING' });
        if (await this.isTokenBlacklisted(token)) throw new AppException(401,'NOT_AUTHENTICATED', { reason: 'TOKEN_EXPIRED' })
        try {
            const payload = this.jwtService.verify(token);
            if (!!payload.exp && new Date(payload.exp) > new Date()) throw new AppException(401,'NOT_AUTHENTICATED', { reason: 'TOKEN_EXPIRED' });
            request.user = { id: parseInt(payload.sub!), role: payload.role, status: payload.status } as IPrincipal;
            return true;
        }
        catch (error) {
            throw new AppException(401,'NOT_AUTHENTICATED', { reason: error.message });
        }
    }
}