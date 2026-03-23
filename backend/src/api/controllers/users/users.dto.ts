import { IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
    @IsString()
    username: string;

    @IsString() @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsPhoneNumber('TN')
    phoneNumber: string;
}

export class LoginDto {
    @IsString()
    username: string;

    @IsString()
    password: string;
}