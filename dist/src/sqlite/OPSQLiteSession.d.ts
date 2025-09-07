import { entityKind } from 'drizzle-orm/entity';
import type { AnyRelations } from 'drizzle-orm/relations';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type * as V1 from 'drizzle-orm/_relations';
import { OPSQLiteBaseSession, OPSQLiteSessionOptions, OPSQLiteTransaction, OPSQLiteTransactionConfig } from './OPSQLiteBaseSession.js';
import { DB } from '@op-engineering/op-sqlite';
export declare class OPSQLiteSession<TFullSchema extends Record<string, unknown>, TRelations extends AnyRelations, TSchema extends V1.TablesRelationalConfig> extends OPSQLiteBaseSession<TFullSchema, TRelations, TSchema> {
    protected relations: TRelations;
    protected schema: V1.RelationalSchemaConfig<TSchema> | undefined;
    static readonly [entityKind]: string;
    protected client: DB;
    constructor(db: DB, dialect: SQLiteSyncDialect, relations: TRelations, schema: V1.RelationalSchemaConfig<TSchema> | undefined, options?: OPSQLiteSessionOptions);
    transaction<T>(transaction: (tx: OPSQLiteTransaction<TFullSchema, TRelations, TSchema>) => T, config?: OPSQLiteTransactionConfig): T;
}
