export abstract class DesignsRepository {
    abstract create(user: CreateDesignDto): Promise<void>;
    abstract findDtoById(id: UUID): Promise<DesignDto | null>;
    abstract findSummaryDtoById(id: UUID): Promise<DesignSummaryDto | null>;
    abstract findAll(query: { cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null>;
    abstract findAllByInventory(query: { id: UUID, cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null>;
    abstract findAllByAlbum(query: { id: UUID, cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null>;
}