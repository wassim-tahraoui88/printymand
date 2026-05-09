import { IsString, IsEmail, MinLength, IsPhoneNumber, IsIn } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString() @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsString()
	address: string;

    @IsPhoneNumber('TN')
    phoneNumber: string;

	@IsIn(['PRINTER', 'DESIGNER', 'CUSTOMER'])
	role: 'PRINTER' | 'DESIGNER' | 'CUSTOMER';
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}