export abstract class ProductsRepository {
    abstract create(dto: CreateProductDto): Promise<void>;
	abstract findAll(): Promise<ProductDto[]>;
    abstract findDtoById(id: UUID): Promise<ProductDto | null>;
}