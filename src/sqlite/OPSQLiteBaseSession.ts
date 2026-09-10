import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import { NoopLogger } from 'drizzle-orm/logger';
import type { AnyRelations } from 'drizzle-orm/relations';
import type { Query } from 'drizzle-orm/sql/sql';
import type { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import {
  SQLiteAsyncPreparedQuery,
  SQLiteAsyncSession,
  SQLiteAsyncTransaction,
  type SQLiteAsyncPreparedQueryConfig
} from 'drizzle-orm/sqlite-core/async/session';
import type { SQLiteExecuteMethod, SQLiteTransactionConfig } from 'drizzle-orm/sqlite-core/session';
import type { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import { type Cache, NoopCache } from 'drizzle-orm/cache/core';
import type { DB, QueryResult, Scalar } from '@op-engineering/op-sqlite';

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

/**
 * Extracts the row-value arrays Drizzle expects from an op-sqlite raw result.
 *
 * op-sqlite >= 17 returns `RawQueryResult` ({ rawRows, columnNames, rowsAffected,
 * insertId }) from `executeRaw`/`executeRawSync`; <= 16 returned the bare
 * `Scalar[][]`. `rawRows` is absent for statements that produce no rows.
 *
 * The return type is derived from `DB` because op-sqlite does not export
 * `RawQueryResult` from its entry point, even though it is now the public
 * return type of `executeRaw`/`executeRawSync`.
 */
function toRawRows(result: ReturnType<DB['executeRawSync']>): Scalar[][] {
  return result?.rawRows ?? [];
}

export class OPSQLiteTransaction<TRelations extends AnyRelations> extends SQLiteAsyncTransaction<
  'sync',
  QueryResult,
  TRelations
> {
  static readonly [entityKind]: string = 'OPSQLiteTransaction';
}

export class OPSQLiteBaseSession<TRelations extends AnyRelations> extends SQLiteAsyncSession<
  'sync',
  QueryResult,
  TRelations
> {
  static readonly [entityKind]: string = 'OPSQLiteBaseSession';

  protected logger: Logger;
  protected cache: Cache;

  constructor(
    protected db: DB,
    dialect: SQLiteDialect,
    protected relations: TRelations,
    protected options: OPSQLiteSessionOptions = {}
  ) {
    super(dialect, 'sync');
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }

  /**
   * Drizzle owns placeholder filling, logging, result mapping and caching as of
   * 1.0.0-rc.4 — a driver only supplies the raw executors below. `mode` selects
   * the row shape: `arrays` wants positional values, everything else wants
   * column-keyed objects.
   */
  prepareQuery(
    query: Query,
    mode: 'arrays' | 'objects' | 'raw',
    _prepare: boolean,
    executeMethod?: SQLiteExecuteMethod,
    mapper?: (rows: any[]) => any,
    queryMetadata?: {
      type: 'select' | 'update' | 'delete' | 'insert';
      tables: string[];
    },
    cacheConfig?: WithCacheConfig
  ): SQLiteAsyncPreparedQuery<OPSQLitePreparedQueryConfig> {
    const { db } = this;
    const { sql } = query;

    const arrays = (params: unknown[]) => toRawRows(db.executeRawSync(sql, params as Scalar[]));
    const objects = (params: unknown[]) => db.executeSync(sql, params as Scalar[]).rows;

    return new SQLiteAsyncPreparedQuery<OPSQLitePreparedQueryConfig>(
      'sync',
      executeMethod,
      {
        all: (params) => (mode === 'arrays' ? arrays(params) : objects(params)),
        get: (params) => (mode === 'arrays' ? arrays(params)[0] : objects(params)[0]),
        run: (params) => db.executeSync(sql, params as Scalar[]),
        values: (params) => arrays(params)
      },
      query,
      mapper,
      mode,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig
    );
  }

  transaction<T>(_transaction: (tx: OPSQLiteTransaction<TRelations>) => T, _config: OPSQLiteTransactionConfig = {}): T {
    throw new Error('Nested transactions are not supported');
  }
}
