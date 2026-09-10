import { entityKind } from 'drizzle-orm/entity';
import type { AnyRelations } from 'drizzle-orm/relations';
import type { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import {
  OPSQLiteBaseSession,
  OPSQLiteTransaction,
  type OPSQLiteSessionOptions,
  type OPSQLiteTransactionConfig
} from './OPSQLiteBaseSession.js';
import type { DB } from '@op-engineering/op-sqlite';

export class OPSQLiteSession<TRelations extends AnyRelations> extends OPSQLiteBaseSession<TRelations> {
  static readonly [entityKind]: string = 'OPSQLiteSession';
  protected client: DB;

  constructor(db: DB, dialect: SQLiteDialect, relations: TRelations, options: OPSQLiteSessionOptions = {}) {
    super(db, dialect, relations, options);
    this.client = db;
  }

  override transaction<T>(
    transaction: (tx: OPSQLiteTransaction<TRelations>) => T,
    config: OPSQLiteTransactionConfig = {}
  ): T {
    let result: T;

    const tx = new OPSQLiteTransaction<TRelations>(
      'sync',
      this.dialect,
      new OPSQLiteBaseSession(this.client, this.dialect, this.relations, this.options),
      this.relations
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
