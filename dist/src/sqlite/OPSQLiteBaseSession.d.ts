import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import type { AnyRelations } from 'drizzle-orm/relations';
import type * as V1 from 'drizzle-orm/_relations';
import { type Query } from 'drizzle-orm/sql/sql';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type { SelectedFieldsOrdered } from 'drizzle-orm/sqlite-core/query-builders/select.types';
import { PreparedQueryConfig, type PreparedQueryConfig as PreparedQueryConfigBase, type SQLiteExecuteMethod, SQLiteSession, SQLiteTransaction, type SQLiteTransactionConfig } from 'drizzle-orm/sqlite-core/session';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
import { OPSQLitePreparedQuery } from './OPSQLitePreparedQuery.js';
import { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import { Cache } from 'drizzle-orm/cache/core';
export interface OPSQLiteSessionOptions {
    logger?: Logger;
    cache?: Cache;
}
export type OPSQLiteTransactionConfig = SQLiteTransactionConfig & {
    accessMode?: 'read only' | 'read write';
};
export declare class OPSQLiteTransaction<TFullSchema extends Record<string, unknown>, TRelations extends AnyRelations, TSchema extends V1.TablesRelationalConfig> extends SQLiteTransaction<'sync', QueryResult, TFullSchema, TRelations, TSchema> {
    static readonly [entityKind]: string;
}
export declare class OPSQLiteBaseSession<TFullSchema extends Record<string, unknown>, TRelations extends AnyRelations, TSchema extends V1.TablesRelationalConfig> extends SQLiteSession<'sync', QueryResult, TFullSchema, TRelations, TSchema> {
    protected db: DB;
    protected dialect: SQLiteSyncDialect;
    protected relations: TRelations;
    protected schema: V1.RelationalSchemaConfig<TSchema> | undefined;
    protected options: OPSQLiteSessionOptions;
    static readonly [entityKind]: string;
    protected logger: Logger;
    private cache;
    constructor(db: DB, dialect: SQLiteSyncDialect, relations: TRelations, schema: V1.RelationalSchemaConfig<TSchema> | undefined, options?: OPSQLiteSessionOptions);
    prepareQuery<T extends PreparedQueryConfigBase & {
        type: 'sync';
    }>(query: Query, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, isResponseInArrayMode: boolean, customResultMapper?: (rows: unknown[][], mapColumnValue?: (value: unknown) => unknown) => unknown, queryMetadata?: {
        type: 'select' | 'update' | 'delete' | 'insert';
        tables: string[];
    }, cacheConfig?: WithCacheConfig): OPSQLitePreparedQuery<T>;
    prepareRelationalQuery<T extends Omit<PreparedQueryConfig, 'run'>>(query: Query, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, customResultMapper: (rows: Record<string, unknown>[]) => unknown): OPSQLitePreparedQuery<T, true>;
    transaction<T>(_transaction: (tx: OPSQLiteTransaction<TFullSchema, TRelations, TSchema>) => T, _config?: OPSQLiteTransactionConfig): T;
}
