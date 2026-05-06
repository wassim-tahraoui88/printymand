export abstract class GlobalRepository {
    abstract findSimpleUserById(id: UUID): Promise<UserSummaryDto | null>;
}
