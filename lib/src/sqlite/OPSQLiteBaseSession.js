var _a, _b;
import { entityKind } from 'drizzle-orm/entity';
import { NoopLogger } from 'drizzle-orm/logger';
import { SQLiteAsyncPreparedQuery, SQLiteAsyncSession, SQLiteAsyncTransaction } from 'drizzle-orm/sqlite-core/async/session';
import { NoopCache } from 'drizzle-orm/cache/core';
/**
 * Extracts the row-value arrays Drizzle expects from an op-sqlite raw result.
 *
 * op-sqlite >= 17 returns `RawQueryResult` ({ rawRows, columnNames, rowsAffected,
 * insertId }) from `executeRaw`/`executeRawSync`; <= 16 returned the bare
 * `Scalar[][]`. `rawRows` is absent for statements that produce no rows.
 *
 * The return type is derived from `DB` because op-sqlite does not export
 * `RawQueryResult` from its entry point, even though it is now the public
 * return type of `executeRaw`/`executeRawSync`.
 */
function toRawRows(result) {
    var _c;
    return (_c = result === null || result === void 0 ? void 0 : result.rawRows) !== null && _c !== void 0 ? _c : [];
}
export class OPSQLiteTransaction extends SQLiteAsyncTransaction {
}
_a = entityKind;
OPSQLiteTransaction[_a] = 'OPSQLiteTransaction';
export class OPSQLiteBaseSession extends SQLiteAsyncSession {
    constructor(db, dialect, relations, options = {}) {
        var _c, _d;
        super(dialect, 'sync');
        this.db = db;
        this.relations = relations;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new NoopLogger();
        this.cache = (_d = options.cache) !== null && _d !== void 0 ? _d : new NoopCache();
    }
    /**
     * Drizzle owns placeholder filling, logging, result mapping and caching as of
     * 1.0.0-rc.4 — a driver only supplies the raw executors below. `mode` selects
     * the row shape: `arrays` wants positional values, everything else wants
     * column-keyed objects.
     */
    prepareQuery(query, mode, _prepare, executeMethod, mapper, queryMetadata, cacheConfig) {
        const { db } = this;
        const { sql } = query;
        const arrays = (params) => toRawRows(db.executeRawSync(sql, params));
        const objects = (params) => db.executeSync(sql, params).rows;
        return new SQLiteAsyncPreparedQuery('sync', executeMethod, {
            all: (params) => (mode === 'arrays' ? arrays(params) : objects(params)),
            get: (params) => (mode === 'arrays' ? arrays(params)[0] : objects(params)[0]),
            run: (params) => db.executeSync(sql, params),
            values: (params) => arrays(params)
        }, query, mapper, mode, this.logger, this.cache, queryMetadata, cacheConfig);
    }
    transaction(_transaction, _config = {}) {
        throw new Error('Nested transactions are not supported');
    }
}
_b = entityKind;
OPSQLiteBaseSession[_b] = 'OPSQLiteBaseSession';
//# sourceMappingURL=OPSQLiteBaseSession.js.map