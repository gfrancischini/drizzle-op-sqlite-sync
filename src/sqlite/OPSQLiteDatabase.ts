import { AnyRelations, EmptyRelations, Query } from 'drizzle-orm';
import { DefaultLogger } from 'drizzle-orm/logger';
// import {
//   createTableRelationsHelpers,
//   extractTablesRelationalConfig,
//   type RelationalSchemaConfig,
//   type TablesRelationalConfig
// } from 'drizzle-orm/relations';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type { DrizzleConfig } from 'drizzle-orm/utils';
import { OPSQLiteSession } from './OPSQLiteSession.js';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
import * as V1 from 'drizzle-orm/_relations';

export type DrizzleQuery<T> = { toSQL(): Query; execute(): Promise<T | T[]> };

export class OPSQLiteDatabase<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations
> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema, TRelations> {
  // static override readonly [entityKind]: string = 'OPSQLiteDatabase';
}

export function drizzle<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations
>(
  client: DB,
  config: DrizzleConfig<TSchema, TRelations> = {}
): OPSQLiteDatabase<TSchema, TRelations> & {
  $client: DB;
} {
  const dialect = new SQLiteSyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }

  let schema: V1.RelationalSchemaConfig<V1.TablesRelationalConfig> | undefined;
  if (config.schema) {
    const tablesConfig = V1.extractTablesRelationalConfig(config.schema, V1.createTableRelationsHelpers);
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }

  const relations = config.relations ?? ({} as TRelations);
  const session = new OPSQLiteSession(client, dialect, relations, schema, { logger, cache: config.cache });
  const db = new OPSQLiteDatabase(
    'sync',
    dialect,
    session,
    relations,
    schema as V1.RelationalSchemaConfig<any>
  ) as OPSQLiteDatabase<TSchema, TRelations>;
  (<any>db).$client = client;
  (<any>db).$cache = config.cache;
  if ((<any>db).$cache) {
    (<any>db).$cache['invalidate'] = config.cache?.onMutate;
  }

  return db as any;
}
