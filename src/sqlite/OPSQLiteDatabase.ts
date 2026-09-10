import type { AnyRelations, EmptyRelations, Query } from 'drizzle-orm';
import { DefaultLogger } from 'drizzle-orm/logger';
import { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core/async/db';
import { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import type { DrizzleConfig } from 'drizzle-orm/utils';
import { OPSQLiteSession } from './OPSQLiteSession.js';
import type { DB, QueryResult } from '@op-engineering/op-sqlite';

export type DrizzleQuery<T> = { toSQL(): Query; execute(): Promise<T | T[]> };

/**
 * `TSchema` is retained for API compatibility with callers that write
 * `OPSQLiteDatabase<Schema, SchemaRelations>`. As of drizzle-orm 1.0.0-rc.4 the
 * relational query builder is driven entirely by `TRelations` (relations v2);
 * the v1 `schema` config no longer participates in the database type.
 */
export class OPSQLiteDatabase<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations
> extends SQLiteAsyncDatabase<'sync', QueryResult, TRelations> {}

export function drizzle<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations
>(
  client: DB,
  config: DrizzleConfig<TSchema, TRelations> = {}
): OPSQLiteDatabase<TSchema, TRelations> & {
  $client: DB;
} {
  const dialect = new SQLiteDialect(config.jit === undefined ? {} : { useJitMappers: config.jit });

  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }

  const relations = config.relations ?? ({} as TRelations);
  const session = new OPSQLiteSession(client, dialect, relations, {
    logger,
    cache: config.cache
  });

  const db = new OPSQLiteDatabase('sync', dialect, session, relations) as OPSQLiteDatabase<TSchema, TRelations>;

  (<any>db).$client = client;
  (<any>db).$cache = config.cache;
  if ((<any>db).$cache) {
    (<any>db).$cache['invalidate'] = config.cache?.onMutate;
  }

  return db as any;
}
