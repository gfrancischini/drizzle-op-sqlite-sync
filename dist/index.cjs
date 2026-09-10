'use strict';

var logger = require('drizzle-orm/logger');
var db = require('drizzle-orm/sqlite-core/async/db');
var dialect = require('drizzle-orm/sqlite-core/dialect');
var entity = require('drizzle-orm/entity');
var session = require('drizzle-orm/sqlite-core/async/session');
var core = require('drizzle-orm/cache/core');

var _a$1, _b;
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
class OPSQLiteTransaction extends session.SQLiteAsyncTransaction {
}
_a$1 = entity.entityKind;
OPSQLiteTransaction[_a$1] = 'OPSQLiteTransaction';
class OPSQLiteBaseSession extends session.SQLiteAsyncSession {
    constructor(db, dialect, relations, options = {}) {
        var _c, _d;
        super(dialect, 'sync');
        this.db = db;
        this.relations = relations;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new logger.NoopLogger();
        this.cache = (_d = options.cache) !== null && _d !== void 0 ? _d : new core.NoopCache();
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
        return new session.SQLiteAsyncPreparedQuery('sync', executeMethod, {
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
_b = entity.entityKind;
OPSQLiteBaseSession[_b] = 'OPSQLiteBaseSession';

var _a;
class OPSQLiteSession extends OPSQLiteBaseSession {
    constructor(db, dialect, relations, options = {}) {
        super(db, dialect, relations, options);
        this.client = db;
    }
    transaction(transaction, config = {}) {
        let result;
        const tx = new OPSQLiteTransaction('sync', this.dialect, new OPSQLiteBaseSession(this.client, this.dialect, this.relations, this.options), this.relations);
        this.client.executeSync(`begin${(config === null || config === void 0 ? void 0 : config.behavior) ? ' ' + config.behavior : ''}`);
        try {
            result = transaction(tx);
            this.client.executeSync('commit');
        }
        catch (err) {
            this.client.executeSync('rollback');
            throw err;
        }
        return result;
    }
}
_a = entity.entityKind;
OPSQLiteSession[_a] = 'OPSQLiteSession';

/**
 * `TSchema` is retained for API compatibility with callers that write
 * `OPSQLiteDatabase<Schema, SchemaRelations>`. As of drizzle-orm 1.0.0-rc.4 the
 * relational query builder is driven entirely by `TRelations` (relations v2);
 * the v1 `schema` config no longer participates in the database type.
 */
class OPSQLiteDatabase extends db.SQLiteAsyncDatabase {
}
function drizzle(client, config = {}) {
    var _a, _b;
    const dialect$1 = new dialect.SQLiteDialect(config.jit === undefined ? {} : { useJitMappers: config.jit });
    let logger$1;
    if (config.logger === true) {
        logger$1 = new logger.DefaultLogger();
    }
    else if (config.logger !== false) {
        logger$1 = config.logger;
    }
    const relations = (_a = config.relations) !== null && _a !== void 0 ? _a : {};
    const session = new OPSQLiteSession(client, dialect$1, relations, {
        logger: logger$1,
        cache: config.cache
    });
    const db = new OPSQLiteDatabase('sync', dialect$1, session, relations);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_b = config.cache) === null || _b === void 0 ? void 0 : _b.onMutate;
    }
    return db;
}

exports.drizzle = drizzle;
//# sourceMappingURL=index.cjs.map
