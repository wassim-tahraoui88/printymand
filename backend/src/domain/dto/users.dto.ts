interface CreateUserDto {
    id: UUID;
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

interface UserDto {
    id: UUID;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatarUrl: string;
    role: 'ADMIN' | 'PRINTER' | 'DESIGNER' | 'CLIENT';
    // status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    createdAt: Date;
}
interface UserSummaryDto {
    id: UUID;
    firstName: string;
    lastName: string;
    avatarUrl: string;
}

interface UserAuthDto {
    id: UUID;
    passwordHash: string;
    role: 'ADMIN' | 'USER';
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}