import { DefaultLogger } from 'drizzle-orm/logger';
// import {
//   createTableRelationsHelpers,
//   extractTablesRelationalConfig,
//   type RelationalSchemaConfig,
//   type TablesRelationalConfig
// } from 'drizzle-orm/relations';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import { OPSQLiteSession } from './OPSQLiteSession.js';
import * as V1 from 'drizzle-orm/_relations';
export class OPSQLiteDatabase extends BaseSQLiteDatabase {
}
export function drizzle(client, config = {}) {
    var _a, _b;
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
        const tablesConfig = V1.extractTablesRelationalConfig(config.schema, V1.createTableRelationsHelpers);
        schema = {
            fullSchema: config.schema,
            schema: tablesConfig.tables,
            tableNamesMap: tablesConfig.tableNamesMap
        };
    }
    const relations = (_a = config.relations) !== null && _a !== void 0 ? _a : {};
    const session = new OPSQLiteSession(client, dialect, relations, schema, { logger, cache: config.cache });
    const db = new OPSQLiteDatabase('sync', dialect, session, relations, schema);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_b = config.cache) === null || _b === void 0 ? void 0 : _b.onMutate;
    }
    return db;
}
