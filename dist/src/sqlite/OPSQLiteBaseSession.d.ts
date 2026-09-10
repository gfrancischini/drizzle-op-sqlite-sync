import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import type { AnyRelations } from 'drizzle-orm/relations';
import type { Query } from 'drizzle-orm/sql/sql';
import type { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import { SQLiteAsyncPreparedQuery, SQLiteAsyncSession, SQLiteAsyncTransaction, type SQLiteAsyncPreparedQueryConfig } from 'drizzle-orm/sqlite-core/async/session';
import type { SQLiteExecuteMethod, SQLiteTransactionConfig } from 'drizzle-orm/sqlite-core/session';
import type { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import { type Cache } from 'drizzle-orm/cache/core';
import type { DB, QueryResult } from '@op-engineering/op-sqlite';
export interface OPSQLiteSessionOptions {
    logger?: Logger;
    cache?: Cache;
}
export type OPSQLiteTransactionConfig = SQLiteTransactionConfig & {
    accessMode?: 'read only' | 'read write';
};
/** The prepared-query config for a synchronous op-sqlite session. */
export type OPSQLitePreparedQueryConfig = SQLiteAsyncPreparedQueryConfig & {
    type: 'sync';
};
export declare class OPSQLiteTransaction<TRelations extends AnyRelations> extends SQLiteAsyncTransaction<'sync', QueryResult, TRelations> {
    static readonly [entityKind]: string;
}
export declare class OPSQLiteBaseSession<TRelations extends AnyRelations> extends SQLiteAsyncSession<'sync', QueryResult, TRelations> {
    protected db: DB;
    protected relations: TRelations;
    protected options: OPSQLiteSessionOptions;
    static readonly [entityKind]: string;
    protected logger: Logger;
    protected cache: Cache;
    constructor(db: DB, dialect: SQLiteDialect, relations: TRelations, options?: OPSQLiteSessionOptions);
    /**
     * Drizzle owns placeholder filling, logging, result mapping and caching as of
     * 1.0.0-rc.4 — a driver only supplies the raw executors below. `mode` selects
     * the row shape: `arrays` wants positional values, everything else wants
     * column-keyed objects.
     */
    prepareQuery(query: Query, mode: 'arrays' | 'objects' | 'raw', _prepare: boolean, executeMethod?: SQLiteExecuteMethod, mapper?: (rows: any[]) => any, queryMetadata?: {
        type: 'select' | 'update' | 'delete' | 'insert';
        tables: string[];
    }, cacheConfig?: WithCacheConfig): SQLiteAsyncPreparedQuery<OPSQLitePreparedQueryConfig>;
    transaction<T>(_transaction: (tx: OPSQLiteTransaction<TRelations>) => T, _config?: OPSQLiteTransactionConfig): T;
}
