
type ColumnDef = { name: string, type: string };
type BulkSyncConfig = {
    table: string;
    columns: ColumnDef[];
    conflictColumns: string[];
};

export class PostgresUtils {

    static buildSchoolSyncQuery({ table, columns, conflictColumns }: BulkSyncConfig): string {
        const columnNames = columns.map(c => c.name);
        const columnDefs = columns
            .map(col => `${col.name} ${col.type}`)
            .join(', ');

        const insertCols = [...columnNames.map(col => col), 'school_id'].join(', ');
        const selectCols = columnNames.map(col => `i.${col}`).join(', ');
        const updateSet = columnNames.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ');
        const matchCondition = conflictColumns
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