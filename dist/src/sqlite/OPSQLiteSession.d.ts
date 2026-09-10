import { entityKind } from 'drizzle-orm/entity';
import type { AnyRelations } from 'drizzle-orm/relations';
import type { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import { OPSQLiteBaseSession, OPSQLiteTransaction, type OPSQLiteSessionOptions, type OPSQLiteTransactionConfig } from './OPSQLiteBaseSession.js';
import type { DB } from '@op-engineering/op-sqlite';
export declare class OPSQLiteSession<TRelations extends AnyRelations> extends OPSQLiteBaseSession<TRelations> {
    static readonly [entityKind]: string;
    protected client: DB;
    constructor(db: DB, dialect: SQLiteDialect, relations: TRelations, options?: OPSQLiteSessionOptions);
    transaction<T>(transaction: (tx: OPSQLiteTransaction<TRelations>) => T, config?: OPSQLiteTransactionConfig): T;
}
