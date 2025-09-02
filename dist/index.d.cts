import { Query } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { DrizzleConfig } from 'drizzle-orm/utils';
import { DB, QueryResult } from '@op-engineering/op-sqlite';

type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
declare class OPSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema> {
}
declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(client: DB, config?: DrizzleConfig<TSchema>): OPSQLiteDatabase<TSchema> & {
    $client: DB;
};

export { OPSQLiteDatabase, drizzle };
export type { DrizzleQuery };
