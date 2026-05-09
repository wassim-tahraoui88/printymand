export abstract class CartRepository {
    abstract create(user: CreateUserDto): Promise<void>;
    abstract findByUsername(username: string): Promise<UserAuthDto | null>;
    abstract findDtoById(id: UUID): Promise<UserDto | null>;
}