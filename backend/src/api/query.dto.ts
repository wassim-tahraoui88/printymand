import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CursorQuery {
    @Type(() => Number) @IsInt()
    cursor: number;

    @Type(() => Number) @IsInt()
    limit: number;
}
export class OffsetQuery {
    @Type(() => Number) @IsInt()
    offset: number;

    @Type(() => Number) @IsInt()
    limit: number;
}