import { QueryResult } from 'pg';
import { AppException } from '../../../shared/exceptions/app.exception';

const VIOLATION_CODES = ['23505', '23514', '23P01'];

type ColumnDef = { name: string, type: string };
type BulkSyncConfig = {
    table: string;
    columns: ColumnDef[];
    conflictColumns: string[];
    matchColumns: string[];
};

const ERRORS: Record<string, () => AppException> = {
    users_unique_username: () => new AppException(409,'ALREADY_EXISTS'),
    schools_unique_code: () => new AppException(500,'ALREADY_EXISTS'),
    school_invitations_unique_token: () => new AppException(500,'ALREADY_EXISTS'),

    subjects_unique_in_school: () => new AppException(409,'ALREADY_EXISTS'),
    rooms_unique_in_school: () => new AppException(409,'ALREADY_EXISTS'),
    classes_unique_in_school: () => new AppException(409,'ALREADY_EXISTS'),

    schedule_entry_valid_start_time: () => new AppException(409,'INVALID_TIME_RANGE'),
    schedule_entry_valid_end_time: () => new AppException(409,'INVALID_TIME_RANGE'),
    schedule_entry_positive_time_range: () => new AppException(409,'INVALID_TIME_RANGE'),
    schedule_entry_requires_one_non_null: () => new AppException(400,'BAD_REQUEST'),
    schedule_entry_teacher_overlap: () => new AppException(409,'SCHEDULE_CONFLICT', { }),
    schedule_entry_room_overlap: () => new AppException(409,'SCHEDULE_CONFLICT'),
    schedule_entry_class_overlap: () => new AppException(409,'SCHEDULE_CONFLICT'),

    meetings_cannot_self_request: () => new AppException(409,'CONFLICT', { REASON: 'SELF_REQUEST' }),
};

export class PostgresUtils {

    static mapError(err: any) {
        if (err.code && VIOLATION_CODES.includes(err.code)) {
            const factory = ERRORS[err.constraint] ?? null;
            return factory ? factory() : new AppException(500,'DATABASE_ERROR', { message: err?.message });
        }
        return new AppException(500,'DATABASE_ERROR', { message: err?.message });
    }

    static getFirst<T>({ rows: [data], rowCount}: QueryResult) {
        if (!rowCount || rowCount === 0) return null;
        return data as T;
    }
    static getAll<T>({ rows, rowCount }: QueryResult) {
        if (!rowCount || rowCount === 0) return [];
        return rows as T[];
    }
    static getExists({ rows, rowCount }: QueryResult<{ exists: boolean }>) {
        if (!rowCount || rowCount === 0) return false;
        return rows[0].exists ?? false;
    }
    static getCount({ rows, rowCount }: QueryResult<{ count: string }>) {
        if (!rowCount || rowCount === 0) return 0;
        return parseInt(rows[0].count, 10) || 0;
    }

    static buildSchoolSyncQuery({ table, columns, conflictColumns, matchColumns }: BulkSyncConfig): string {
        const columnNames = columns.map(c => c.name);
        const columnDefs = columns
            .map(col => `${col.name} ${col.type}`)
            .join(', ');

        const insertCols = [...columnNames.map(col => col), 'school_id'].join(', ');
        const selectCols = columnNames.map(col => `i.${col}`).join(', ');
        const updateSet = columnNames.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ');
        const matchCondition = matchColumns
            .map(col => col === 'school_id' ? `${table}.school_id = $1` : `${table}.${col} = i.${col}`)
            .join(' AND ');

        const conflict = conflictColumns.join(', ');
        return `
            WITH incoming AS (
                SELECT *
                FROM jsonb_to_recordset($2::jsonb)
                AS x(${columnDefs})
            ),
            upserted AS (
                INSERT INTO ${table} (${insertCols})
                SELECT ${selectCols}, $1
                FROM incoming i
                ON CONFLICT (${conflict})
                DO UPDATE SET ${updateSet}
            )
            DELETE FROM ${table}
            WHERE school_id = $1
            AND NOT EXISTS (SELECT 1 FROM incoming i WHERE ${matchCondition})
            RETURNING id;
        `;
    }
}