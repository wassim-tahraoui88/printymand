interface CreateProductDto {
    id: UUID;
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

interface ProductDto {
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