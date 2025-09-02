import { entityKind } from 'drizzle-orm/entity';
import type { RelationalSchemaConfig, TablesRelationalConfig } from 'drizzle-orm/relations';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import { OPSQLiteBaseSession, OpSQLiteSessionOptions, OPSQLiteTransaction, OPSQLiteTransactionConfig } from './OPSQLiteBaseSession.js';
import { DB } from '@op-engineering/op-sqlite';
export declare class OPSQLiteSession<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends OPSQLiteBaseSession<TFullSchema, TSchema> {
    static readonly [entityKind]: string;
    protected client: DB;
    constructor(db: DB, dialect: SQLiteSyncDialect, schema: RelationalSchemaConfig<TSchema> | undefined, options?: OpSQLiteSessionOptions);
    transaction<T>(transaction: (tx: OPSQLiteTransaction<TFullSchema, TSchema>) => T, config?: OPSQLiteTransactionConfig): T;
}
