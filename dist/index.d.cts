import { AnyRelations, EmptyRelations, Query } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { DrizzleConfig } from 'drizzle-orm/utils';
import { DB, QueryResult } from '@op-engineering/op-sqlite';

type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
declare class OPSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema, TRelations> {
}
declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TRelations extends AnyRelations = EmptyRelations>(client: DB, config?: DrizzleConfig<TSchema, TRelations>): OPSQLiteDatabase<TSchema, TRelations> & {
    $client: DB;
};

export { OPSQLiteDatabase, drizzle };
export type { DrizzleQuery };
