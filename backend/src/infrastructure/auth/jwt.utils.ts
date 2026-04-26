import { Response } from 'express';
import { HEADER_AUTH_TOKEN } from '../../shared';
import { Handshake } from 'socket.io/dist/socket-types';

export class JwtUtils {

    static extractTokenFromHandshake(handshake: Handshake): string | null {
        const cookies = handshake.headers.cookie || '';
        const cookiesString = cookies.split(';');
        const tokenCookie = cookiesString.find(cookie => cookie.trim().startsWith(`AUTH_TOKEN=`));
        return tokenCookie?.split('=')[1] || handshake.auth.token;
    }

    static writeToCookie(token: string, response: Response) {
        response.cookie(HEADER_AUTH_TOKEN, token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : undefined,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 3600000 * 24 * 30) // 30 days
        });
    }

    static clearCookie(response: Response) {
        response.clearCookie(HEADER_AUTH_TOKEN);
    }
}
