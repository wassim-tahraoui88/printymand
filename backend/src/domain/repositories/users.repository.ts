export abstract class UsersRepository {
    abstract create(user: CreateUserDto): Promise<void>;
    abstract findByEmail(email: string): Promise<UserAuthDto | null>;
    abstract findDtoById(id: UUID): Promise<UserDto | null>;
}