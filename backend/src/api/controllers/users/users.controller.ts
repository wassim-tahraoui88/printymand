import { Controller, Body, Post, UseGuards, Res } from '@nestjs/common';
import { JwtGuard } from '../../guards';
import { RegisterDto, LoginDto } from './users.dto';
import { RegisterUseCase, LoginUseCase, RefreshUseCase } from '../../../application/users/use-cases';
import { PrincipalUser } from '../../decorators';
import { JwtUtils } from '../../../infrastructure/auth/jwt.utils';
import { Response } from 'express';

@Controller('users')
export class UsersController {

    constructor(private readonly register: RegisterUseCase,
                private readonly login: LoginUseCase,
                private readonly refresh: RefreshUseCase) {}

    @Post('register')
    async onRegister(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const response = await this.register.execute(dto);
        JwtUtils.writeToCookie(response.token, res);
        return response;
    }

    @Post('login')
    async onLogin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const response = await this.login.execute(dto);
        JwtUtils.writeToCookie(response.token, res);
        return response;
    }

    @Post('me')
    @UseGuards(JwtGuard)
    onMe(@PrincipalUser() principal: IPrincipal) {
        return principal;
    }

    @Post('refresh')
    @UseGuards(JwtGuard)
    onRefresh(@PrincipalUser() principal: IPrincipal) {
        return this.refresh.execute(principal);
    }

    /*@Post() @HttpCode(HttpStatus.CREATED)

    //region GET Methods
    @Get('teachers') @HttpCode(HttpStatus.OK)
    @Roles(1)
    findTeachers(@AuthSubject() principal: AuthUser, @Query() query: PaginationOptions) {
        return this.service.findAll(principal, { ...query, filter: { ...query.filter, role: 2 } });
    }

    @Get('parents') @HttpCode(HttpStatus.OK)
    @Roles(1, 2)
    findParents(@AuthSubject() principal: AuthUser, @Query() query: PaginationOptions) {
        return this.service.findAll(principal, { ...query, filter: { ...query.filter, role: 3 } });
    }

    @Get('username/:username') @HttpCode(HttpStatus.OK)
    @Roles(1)
    findByUsername(@Param('username') email: string) {
        return this.service.findByUsername(email);
    }

    @Get() @HttpCode(HttpStatus.OK)
    @Roles(1,2,3)
    findAll(@AuthSubject() principal: AuthUser, @Query() query: PaginationOptions) {
        return this.service.findAll(principal, query);
    }

    @Get(':id') @HttpCode(HttpStatus.OK)
    @Roles(1)
    findById(@AuthSubject() principal: AuthUser, @Param('id') id: string) {
        return this.service.findById(principal, id);
    }
    //endregion

    @Patch('status/:id') @HttpCode(HttpStatus.OK)
    @Roles(1)
    updateStatus(@AuthSubject() principal: AuthUser, @Param('id') id: string, @Body('status') status: AccountStatus) {
        return this.service.updateStatus(principal, id, status);
    }

    @Patch('me') @HttpCode(HttpStatus.OK)
    @Roles(1, 2, 3)
    updateMe(@AuthSubject() principal: AuthUser, @Body() body: UpdateUserDto) {
        return this.service.update(principal.userId, body);
    }

    @Patch('data') @HttpCode(HttpStatus.OK)
    @Roles(2)
    updateData(@AuthSubject() principal: AuthUser, @Body() body: TeacherData) {
        return this.service.updateData(principal, body);
    }


    @Delete(':id') @HttpCode(HttpStatus.OK)
    @Roles(1)
    remove(@AuthSubject() principal: AuthUser, @Param('id') id: string) {
        return this.service.remove(principal, id);
    }

    @Delete('me') @HttpCode(HttpStatus.OK)
    @Roles(1, 2, 3)
    removeMe(@AuthSubject() principal: AuthUser) {
        return this.service.remove(null, principal.userId);
    }*/
}