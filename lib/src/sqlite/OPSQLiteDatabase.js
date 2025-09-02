import { DefaultLogger } from 'drizzle-orm/logger';
import { createTableRelationsHelpers, extractTablesRelationalConfig } from 'drizzle-orm/relations';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import { OPSQLiteSession } from './OPSQLiteSession.js';
export class OPSQLiteDatabase extends BaseSQLiteDatabase {
}
export function drizzle(client, config = {}) {
    var _a;
    const dialect = new SQLiteSyncDialect({ casing: config.casing });
    let logger;
    if (config.logger === true) {
        logger = new DefaultLogger();
    }
    else if (config.logger !== false) {
        logger = config.logger;
    }
    let schema;
    if (config.schema) {
        const tablesConfig = extractTablesRelationalConfig(config.schema, createTableRelationsHelpers);
        schema = {
            fullSchema: config.schema,
            schema: tablesConfig.tables,
            tableNamesMap: tablesConfig.tableNamesMap
        };
    }
    const session = new OPSQLiteSession(client, dialect, schema, { logger });
    const db = new OPSQLiteDatabase('sync', dialect, session, schema);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_a = config.cache) === null || _a === void 0 ? void 0 : _a.onMutate;
    }
    return db;
}
