import { AnyRelations, EmptyRelations, Query } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import type { DrizzleConfig } from 'drizzle-orm/utils';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
export type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
export declare class OPSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema, TRelations> {
}
export declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations>(client: DB, config?: DrizzleConfig<TSchema, TRelations>): OPSQLiteDatabase<TSchema, TRelations> & {
    $client: DB;
};
