import { Type } from 'class-transformer';
import { IsInt, IsUUID } from 'class-validator';

export class CursorQuery {
    @Type(() => Number) @IsUUID(7)
    cursor: UUID;

    @Type(() => Number) @IsInt()
    limit: number;
}
export class OffsetQuery {
    @Type(() => Number) @IsInt()
    offset: number;

    @Type(() => Number) @IsInt()
    limit: number;
}