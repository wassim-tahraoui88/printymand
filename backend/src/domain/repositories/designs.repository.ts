export abstract class DesignsRepository {
    abstract create(user: CreateDesignDto): Promise<void>;
    abstract findDtoById(id: UUID): Promise<DesignDto | null>;
    abstract findSummaryDtoById(id: UUID): Promise<DesignSummaryDto | null>;
    abstract findAll({ cursor, limit } : { cursor?: UUID, limit?: number }): Promise<DesignSummaryDto[] | null>;
}