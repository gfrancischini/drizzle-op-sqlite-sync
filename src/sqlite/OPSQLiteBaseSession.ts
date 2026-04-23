import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import { NoopLogger } from 'drizzle-orm/logger';
import type { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations';
import type * as V1 from 'drizzle-orm/_relations';
import { type Query } from 'drizzle-orm/sql/sql';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type { SelectedFieldsOrdered } from 'drizzle-orm/sqlite-core/query-builders/select.types';
import {
  PreparedQueryConfig,
  type PreparedQueryConfig as PreparedQueryConfigBase,
  type SQLiteExecuteMethod,
  SQLiteSession,
  SQLiteTransaction,
  type SQLiteTransactionConfig
} from 'drizzle-orm/sqlite-core/session';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
import { OPSQLitePreparedQuery } from './OPSQLitePreparedQuery.js';

import { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import { Cache, NoopCache } from 'drizzle-orm/cache/core';
export interface OPSQLiteSessionOptions {
  logger?: Logger;
  cache?: Cache;
}

export type OPSQLiteTransactionConfig = SQLiteTransactionConfig & {
  accessMode?: 'read only' | 'read write';
};

export class OPSQLiteTransaction<
  TFullSchema extends Record<string, unknown>,
  TRelations extends AnyRelations,
  TSchema extends V1.TablesRelationalConfig
> extends SQLiteTransaction<'sync', QueryResult, TFullSchema, TRelations, TSchema> {
  static readonly [entityKind]: string = 'OPSQLiteTransaction';
}

export class OPSQLiteBaseSession<
  TFullSchema extends Record<string, unknown>,
  TRelations extends AnyRelations,
  TSchema extends V1.TablesRelationalConfig
> extends SQLiteSession<'sync', QueryResult, TFullSchema, TRelations, TSchema> {
  static readonly [entityKind]: string = 'OPSQLiteBaseSession';

  protected logger: Logger;
  private cache: Cache;

  constructor(
    protected db: DB,
    protected dialect: SQLiteSyncDialect,
    protected relations: TRelations,
    protected schema: V1.RelationalSchemaConfig<TSchema> | undefined,
    protected options: OPSQLiteSessionOptions = {}
  ) {
    super(dialect);
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }

  prepareQuery<T extends PreparedQueryConfigBase & { type: 'sync' }>(
    query: Query,
    fields: SelectedFieldsOrdered | undefined,
    executeMethod: SQLiteExecuteMethod,
    isResponseInArrayMode: boolean,
    customResultMapper?: (rows: unknown[][], mapColumnValue?: (value: unknown) => unknown) => unknown,
    queryMetadata?: {
      type: 'select' | 'update' | 'delete' | 'insert';
      tables: string[];
    },
    cacheConfig?: WithCacheConfig
  ): OPSQLitePreparedQuery<T> {
    return new OPSQLitePreparedQuery(
      this.db,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }

  prepareRelationalQuery<T extends Omit<PreparedQueryConfig, 'run'>>(
    query: Query,
    fields: SelectedFieldsOrdered | undefined,
    executeMethod: SQLiteExecuteMethod,
    customResultMapper: (rows: Record<string, unknown>[]) => unknown
  ): OPSQLitePreparedQuery<T, true> {
    return new OPSQLitePreparedQuery(
      this.db,
      query,
      this.logger,
      this.cache,
      undefined,
      undefined,
      fields,
      executeMethod,
      false,
      customResultMapper,
      true
    );
  }

  transaction<T>(
    _transaction: (tx: OPSQLiteTransaction<TFullSchema, TRelations, TSchema>) => T,
    _config: OPSQLiteTransactionConfig = {}
  ): T {
    throw new Error('Nested transactions are not supported');
  }
}
