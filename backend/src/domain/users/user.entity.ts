export type Role = 'ADMIN' | 'USER';
export type UserStatus = 'INCOMPLETE' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export enum MembershipRole {
    OWNER = 0,
    ADMINISTRATOR = 1,
    STAFF = 2,
    TEACHER = 3,
    PARENT = 4,
    STUDENT = 5
}

export class User {
    constructor(
        public id: number | null,
        public username: string,
        public passwordHash: string,
        public firstName: string,
        public lastName: string,
        public phoneNumber: string,
        public avatarUrl: string,
        public role: Role,
        public status: UserStatus,
        public readonly createdAt: Date) {}

    get isAdmin() {
        return this.role === 'ADMIN';
    }
    get isUser() {
        return this.role === 'USER';
    }
}