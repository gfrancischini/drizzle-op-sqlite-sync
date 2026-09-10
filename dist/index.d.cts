import { AnyRelations, EmptyRelations, Query } from 'drizzle-orm';
import { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core/async/db';
import { DrizzleConfig } from 'drizzle-orm/utils';
import { DB, QueryResult } from '@op-engineering/op-sqlite';

type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
/**
 * `TSchema` is retained for API compatibility with callers that write
 * `OPSQLiteDatabase<Schema, SchemaRelations>`. As of drizzle-orm 1.0.0-rc.4 the
 * relational query builder is driven entirely by `TRelations` (relations v2);
 * the v1 `schema` config no longer participates in the database type.
 */
declare class OPSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations> extends SQLiteAsyncDatabase<'sync', QueryResult, TRelations> {
}
declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations>(client: DB, config?: DrizzleConfig<TSchema, TRelations>): OPSQLiteDatabase<TSchema, TRelations> & {
    $client: DB;
};

export { OPSQLiteDatabase, drizzle };
export type { DrizzleQuery };
