import { Type } from 'class-transformer';
import { IsOptional, Min, IsInt } from 'class-validator';


export class PaginationOptions {
    @Type(() => Number)
    @IsInt() @Min(1)
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsInt() @Min(1)
    @IsOptional()
    size?: number;

    @Type(() => Object)
    @IsOptional()
    filter?: any;

    @Type(() => String)
    @IsOptional()
    sortBy?: string[] = [];

    @Type(() => String)
    @IsOptional()
    sortOrder?: ('asc' | 'desc')[] = [];
}