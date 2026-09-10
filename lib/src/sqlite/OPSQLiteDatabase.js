import { DefaultLogger } from 'drizzle-orm/logger';
import { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core/async/db';
import { SQLiteDialect } from 'drizzle-orm/sqlite-core/dialect';
import { OPSQLiteSession } from './OPSQLiteSession.js';
/**
 * `TSchema` is retained for API compatibility with callers that write
 * `OPSQLiteDatabase<Schema, SchemaRelations>`. As of drizzle-orm 1.0.0-rc.4 the
 * relational query builder is driven entirely by `TRelations` (relations v2);
 * the v1 `schema` config no longer participates in the database type.
 */
export class OPSQLiteDatabase extends SQLiteAsyncDatabase {
}
export function drizzle(client, config = {}) {
    var _a, _b;
    const dialect = new SQLiteDialect(config.jit === undefined ? {} : { useJitMappers: config.jit });
    let logger;
    if (config.logger === true) {
        logger = new DefaultLogger();
    }
    else if (config.logger !== false) {
        logger = config.logger;
    }
    const relations = (_a = config.relations) !== null && _a !== void 0 ? _a : {};
    const session = new OPSQLiteSession(client, dialect, relations, {
        logger,
        cache: config.cache
    });
    const db = new OPSQLiteDatabase('sync', dialect, session, relations);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_b = config.cache) === null || _b === void 0 ? void 0 : _b.onMutate;
    }
    return db;
}
//# sourceMappingURL=OPSQLiteDatabase.js.map