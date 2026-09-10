'use strict';

var logger = require('drizzle-orm/logger');
var db = require('drizzle-orm/sqlite-core/db');
var dialect = require('drizzle-orm/sqlite-core/dialect');
var entity = require('drizzle-orm/entity');
var session = require('drizzle-orm/sqlite-core/session');
var drizzleOrm = require('drizzle-orm');
var sql = require('drizzle-orm/sql/sql');
var core = require('drizzle-orm/cache/core');
var V1 = require('drizzle-orm/_relations');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var V1__namespace = /*#__PURE__*/_interopNamespaceDefault(V1);

var _a$2;
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
    var _b;
    return (_b = result === null || result === void 0 ? void 0 : result.rawRows) !== null && _b !== void 0 ? _b : [];
}
class OPSQLitePreparedQuery extends session.SQLitePreparedQuery {
    constructor(db, query, logger, cache, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper, isRqbV2Query) {
        super('sync', executeMethod, query, cache, queryMetadata, cacheConfig);
        this.db = db;
        this.logger = logger;
        this.fields = fields;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
        this.isRqbV2Query = isRqbV2Query;
    }
    execute(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = toRawRows(this.db.executeRawSync(this.query.sql, params));
        return new session.ExecuteResultSync(() => {
            return this.mapResult(rs, false);
        });
    }
    run(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeSync(this.query.sql, params);
        return rs;
        // return this.queryWithCache(this.query.sql, params, async () => {
        //   return this.client.executeAsync(this.query.sql, params);
        // });
    }
    all(placeholderValues) {
        var _b;
        if (this.isRqbV2Query)
            return this.allRqbV2(placeholderValues);
        const joinsNotNullableMap = this.joinsNotNullableMap;
        const { fields, /*joinsNotNullableMap,*/ query, logger, customResultMapper, db } = this;
        if (!fields && !customResultMapper) {
            const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
            logger.logQuery(query.sql, params);
            const rs = this.db.executeSync(this.query.sql, params);
            return (_b = rs.rows) !== null && _b !== void 0 ? _b : [];
            // return await this.queryWithCache(query.sql, params, async () => {
            //   return client.execute(query.sql, params).rows?._array || [];
            // });
        }
        const rows = this.values(placeholderValues);
        if (customResultMapper) {
            const mapped = customResultMapper(rows);
            return mapped;
        }
        return rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
    }
    get(placeholderValues) {
        if (this.isRqbV2Query)
            return this.getRqbV2(placeholderValues);
        const { fields, /*joinsNotNullableMap,*/ customResultMapper, query, logger } = this;
        const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        logger.logQuery(query.sql, params);
        const joinsNotNullableMap = this.joinsNotNullableMap;
        if (!fields && !customResultMapper) {
            return this.db.executeSync(this.query.sql, params);
            // const rows = await this.queryWithCache(query.sql, params, async () => {
            //   return client.execute(query.sql, params).rows?._array || [];
            // });
            // return rows[0];
        }
        const rows = this.values(placeholderValues);
        const row = rows[0];
        if (!row) {
            return undefined;
        }
        if (customResultMapper) {
            return customResultMapper(rows);
        }
        return mapResultRow(fields, row, joinsNotNullableMap);
    }
    getRqbV2(placeholderValues) {
        const { customResultMapper, query, logger, db } = this;
        const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        logger.logQuery(query.sql, params);
        const rows = db.executeSync(query.sql, params).rows || [];
        const row = rows[0];
        if (!row) {
            return undefined;
        }
        return customResultMapper([row]);
    }
    allRqbV2(placeholderValues) {
        const { query, logger, customResultMapper, db } = this;
        const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        logger.logQuery(query.sql, params);
        const rows = db.executeSync(query.sql, params).rows || [];
        return customResultMapper(rows);
    }
    values(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        return toRawRows(this.db.executeRawSync(this.query.sql, params));
        // return await this.queryWithCache(this.query.sql, params, async () => {
        //   return await this.client.executeRawAsync(this.query.sql, params);
        // });
    }
    isResponseInArrayMode() {
        return this._isResponseInArrayMode;
    }
}
_a$2 = entity.entityKind;
OPSQLitePreparedQuery[_a$2] = 'OPSQLitePreparedQuery';
/**
 * Maps a database row object to a result object based on the provided column definitions.
 * It reconstructs the hierarchical structure of the result by following the specified paths for each field.
 * It also handles nullification of nested objects when joined tables are nullable.
 */
function mapResultRow(columns, row, joinsNotNullableMap) {
    // Key -> nested object key, value -> table name if all fields in the nested object are from the same table, false otherwise
    const nullifyMap = {};
    const result = columns.reduce((result, { path, field }, columnIndex) => {
        const decoder = getDecoder(field);
        let node = result;
        for (const [pathChunkIndex, pathChunk] of path.entries()) {
            if (pathChunkIndex < path.length - 1) {
                if (!(pathChunk in node)) {
                    node[pathChunk] = {};
                }
                node = node[pathChunk];
            }
            else {
                const rawValue = row[columnIndex];
                const value = (node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue));
                updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap);
            }
        }
        return result;
    }, {});
    applyNullifyMap(result, nullifyMap, joinsNotNullableMap);
    return result;
}
/**
 * Determines the appropriate decoder for a given field.
 */
function getDecoder(field) {
    if (entity.is(field, drizzleOrm.Column)) {
        return field;
    }
    else if (entity.is(field, drizzleOrm.SQL)) {
        return field.decoder;
    }
    else {
        return field.sql.decoder;
    }
}
function updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap) {
    if (!joinsNotNullableMap || !entity.is(field, drizzleOrm.Column) || path.length !== 2) {
        return;
    }
    const objectName = path[0];
    if (!(objectName in nullifyMap)) {
        // @ts-expect-error
        nullifyMap[objectName] = value === null ? drizzleOrm.getTableName(field.table) : false;
        // @ts-expect-error
    }
    else if (typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== drizzleOrm.getTableName(field.table)) {
        nullifyMap[objectName] = false;
    }
}
/**
 * Nullify all nested objects from nullifyMap that are nullable
 */
function applyNullifyMap(result, nullifyMap, joinsNotNullableMap) {
    if (!joinsNotNullableMap || Object.keys(nullifyMap).length === 0) {
        return;
    }
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
        if (typeof tableName === 'string' && !joinsNotNullableMap[tableName]) {
            result[objectName] = null;
        }
    }
}

var _a$1, _b;
class OPSQLiteTransaction extends session.SQLiteTransaction {
}
_a$1 = entity.entityKind;
OPSQLiteTransaction[_a$1] = 'OPSQLiteTransaction';
class OPSQLiteBaseSession extends session.SQLiteSession {
    constructor(db, dialect, relations, schema, options = {}) {
        var _c, _d;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.relations = relations;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new logger.NoopLogger();
        this.cache = (_d = options.cache) !== null && _d !== void 0 ? _d : new core.NoopCache();
    }
    prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
        return new OPSQLitePreparedQuery(this.db, query, this.logger, this.cache, queryMetadata, cacheConfig, fields, executeMethod, isResponseInArrayMode, customResultMapper);
    }
    prepareRelationalQuery(query, fields, executeMethod, customResultMapper) {
        return new OPSQLitePreparedQuery(this.db, query, this.logger, this.cache, undefined, undefined, fields, executeMethod, false, customResultMapper, true);
    }
    transaction(_transaction, _config = {}) {
        throw new Error('Nested transactions are not supported');
    }
}
_b = entity.entityKind;
OPSQLiteBaseSession[_b] = 'OPSQLiteBaseSession';

var _a;
class OPSQLiteSession extends OPSQLiteBaseSession {
    constructor(db, dialect, relations, schema, options = {}) {
        super(db, dialect, relations, schema, options);
        this.relations = relations;
        this.schema = schema;
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
    transaction(transaction, config = {}) {
        let result;
        const tx = new OPSQLiteTransaction('sync', this.dialect, new OPSQLiteBaseSession(this.client, this.dialect, this.relations, this.schema, this.options), this.relations, this.schema);
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

class OPSQLiteDatabase extends db.BaseSQLiteDatabase {
}
function drizzle(client, config = {}) {
    var _a, _b;
    const dialect$1 = new dialect.SQLiteSyncDialect({ casing: config.casing });
    let logger$1;
    if (config.logger === true) {
        logger$1 = new logger.DefaultLogger();
    }
    else if (config.logger !== false) {
        logger$1 = config.logger;
    }
    let schema;
    if (config.schema) {
        const tablesConfig = V1__namespace.extractTablesRelationalConfig(config.schema, V1__namespace.createTableRelationsHelpers);
        schema = {
            fullSchema: config.schema,
            schema: tablesConfig.tables,
            tableNamesMap: tablesConfig.tableNamesMap
        };
    }
    const relations = (_a = config.relations) !== null && _a !== void 0 ? _a : {};
    const session = new OPSQLiteSession(client, dialect$1, relations, schema, { logger: logger$1, cache: config.cache });
    const db = new OPSQLiteDatabase('sync', dialect$1, session, relations, schema);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_b = config.cache) === null || _b === void 0 ? void 0 : _b.onMutate;
    }
    return db;
}

exports.drizzle = drizzle;
//# sourceMappingURL=index.cjs.map
