import { entityKind } from 'drizzle-orm/entity';
import type { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type * as V1 from 'drizzle-orm/_relations';
import {
  OPSQLiteBaseSession,
  OPSQLiteSessionOptions,
  OPSQLiteTransaction,
  OPSQLiteTransactionConfig
} from './OPSQLiteBaseSession.js';
import { DB } from '@op-engineering/op-sqlite';

export class OPSQLiteSession<
  TFullSchema extends Record<string, unknown>,
  TRelations extends AnyRelations,
  TSchema extends V1.TablesRelationalConfig
> extends OPSQLiteBaseSession<TFullSchema, TRelations, TSchema> {
  static readonly [entityKind]: string = 'OPSQLiteSession';
  protected client: DB;
  constructor(
    db: DB,
    dialect: SQLiteSyncDialect,
    protected relations: TRelations,
    protected schema: V1.RelationalSchemaConfig<TSchema> | undefined,
    options: OPSQLiteSessionOptions = {}
  ) {
    super(db, dialect, relations, schema, options);
    this.client = db;
  }

  // constructor(
  //   private client: OPSQLiteConnection,
  //   dialect: SQLiteAsyncDialect
  // ) {
  //   super(dialect);
  //   this.logger = options.logger ?? new NoopLogger();
  //   this.cache = options.cache ?? new NoopCache();
  // }

  transaction<T>(
    transaction: (tx: OPSQLiteTransaction<TFullSchema, TRelations, TSchema>) => T,
    config: OPSQLiteTransactionConfig = {}
  ): T {
    let result: T;

    const tx = new OPSQLiteTransaction<TFullSchema, TRelations, TSchema>(
      'sync',
      this.dialect,
      new OPSQLiteBaseSession(this.client, this.dialect, this.relations, this.schema, this.options),
      this.relations,
      this.schema
    );

    this.client.executeSync(`begin${config?.behavior ? ' ' + config.behavior : ''}`);
    try {
      result = transaction(tx);
      this.client.executeSync('commit');
    } catch (err) {
      this.client.executeSync('rollback');
      throw err;
    }

    return result;
  }
}
