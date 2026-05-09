interface CreateUserDto {
    id: UUID;
    email: string;
    passwordHash: string;
    name: string;
    address: string;
    phoneNumber: string;
    role: 'PRINTER' | 'DESIGNER' | 'CUSTOMER';
}

interface UserDto {
    id: UUID;
    email: string;
    name: string;
	address: string;
    phoneNumber: string;
    role: 'ADMIN' | 'PRINTER' | 'DESIGNER' | 'CUSTOMER';
    createdAt: Date;
}
interface UserSummaryDto {
    id: UUID;
    email: string;
    name: string;
}

interface UserAuthDto {
    id: UUID;
    passwordHash: string;
	role: 'ADMIN' | 'PRINTER' | 'DESIGNER' | 'CUSTOMER';
}