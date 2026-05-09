import { Controller, Body, Post, UseGuards, Res, Get } from '@nestjs/common';
import { JwtGuard } from '../../guards';
import { RegisterDto, LoginDto } from './auth.dto';
import { RegisterUseCase, LoginUseCase, LogoutUseCase, RefreshUseCase } from '../../../application/use-cases/auth';
import { PrincipalUser } from '../../decorators';
import { JwtUtils } from '../../../infrastructure/auth/jwt.utils';
import { Response } from 'express';

@Controller('auth')
export class AuthController {

    constructor(private readonly register: RegisterUseCase,
                private readonly login: LoginUseCase,
                private readonly refresh: RefreshUseCase,
                private readonly logout: LogoutUseCase) {}

    @Post('register')
    async onRegister(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const response = await this.register.execute({ ...body });
        JwtUtils.writeToCookie(response.token, res);
        return response;
    }

    @Post('login')
    async onLogin(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const response = await this.login.execute({ ...body });
        JwtUtils.writeToCookie(response.token, res);
        return response;
    }

    @Post('logout')
    @UseGuards(JwtGuard)
    async onLogout(@PrincipalUser() { id }: IPrincipal, @Res({ passthrough: true }) res: Response) {
        this.logout.execute({ id });
        JwtUtils.clearCookie(res);
    }

    @Get('me')
    @UseGuards(JwtGuard)
    onMe(@PrincipalUser() principal: IPrincipal) {
        return principal;
    }

    @Get('refresh')
    @UseGuards(JwtGuard)
    onRefresh(@PrincipalUser() principal: IPrincipal) {
        return this.refresh.execute(principal);
    }
}