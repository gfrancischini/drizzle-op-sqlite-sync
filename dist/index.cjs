'use strict';

var logger = require('drizzle-orm/logger');
var relations = require('drizzle-orm/relations');
var db = require('drizzle-orm/sqlite-core/db');
var dialect = require('drizzle-orm/sqlite-core/dialect');
var entity = require('drizzle-orm/entity');
var session = require('drizzle-orm/sqlite-core/session');
var drizzleOrm = require('drizzle-orm');
var sql = require('drizzle-orm/sql/sql');

var _a$2;
class OPSQLitePreparedQuery extends session.SQLitePreparedQuery {
    constructor(db, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        super("sync", executeMethod, query);
        this.db = db;
        this.logger = logger;
        this.fields = fields;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
    }
    execute(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeRawSync(this.query.sql, params);
        return new session.ExecuteResultSync(() => {
            return this.mapResult(rs, false);
        });
    }
    run(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeSync(this.query.sql, params);
        return rs;
    }
    all(placeholderValues) {
        var _b;
        const { fields, query, logger, customResultMapper } = this;
        if (!fields && !customResultMapper) {
            const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
            logger.logQuery(query.sql, params);
            const rs = this.db.executeSync(this.query.sql, params);
            return (_b = rs.rows) !== null && _b !== void 0 ? _b : [];
        }
        const rows = this.values(placeholderValues);
        if (customResultMapper) {
            const mapped = customResultMapper(rows);
            return mapped;
        }
        return rows.map((row) => mapResultRow(fields, row, this.joinsNotNullableMap));
    }
    get(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const { fields, customResultMapper } = this;
        const joinsNotNullableMap = this.joinsNotNullableMap;
        if (!fields && !customResultMapper) {
            return this.db.executeSync(this.query.sql, params);
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
    values(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        return this.db.executeRawSync(this.query.sql, params);
    }
    isResponseInArrayMode() {
        return this._isResponseInArrayMode;
    }
}
_a$2 = entity.entityKind;
OPSQLitePreparedQuery[_a$2] = "OPSQLitePreparedQuery";
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
                const value = (node[pathChunk] =
                    rawValue === null ? null : decoder.mapFromDriverValue(rawValue));
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
        nullifyMap[objectName] = value === null ? drizzleOrm.getTableName(field.table) : false;
    }
    else if (typeof nullifyMap[objectName] === "string" &&
        nullifyMap[objectName] !== drizzleOrm.getTableName(field.table)) {
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
        if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
            result[objectName] = null;
        }
    }
}

var _a$1, _b;
class OPSQLiteTransaction extends session.SQLiteTransaction {
}
_a$1 = entity.entityKind;
OPSQLiteTransaction[_a$1] = "OPSQLiteTransaction";
class OPSQLiteBaseSession extends session.SQLiteSession {
    constructor(db, dialect, schema, options = {}) {
        var _c;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new logger.NoopLogger();
    }
    prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
        return new OPSQLitePreparedQuery(this.db, query, this.logger, fields, executeMethod, isResponseInArrayMode, customResultMapper);
    }
    transaction(_transaction, _config = {}) {
        throw new Error("Nested transactions are not supported");
    }
}
_b = entity.entityKind;
OPSQLiteBaseSession[_b] = "OPSQLiteBaseSession";

var _a;
class OPSQLiteSession extends OPSQLiteBaseSession {
    constructor(db, dialect, schema, options = {}) {
        super(db, dialect, schema, options);
        this.client = db;
    }
    transaction(transaction, config = {}) {
        let result;
        const tx = new OPSQLiteTransaction('sync', this.dialect, new OPSQLiteBaseSession(this.client, this.dialect, this.schema, this.options), this.schema);
        //this.run(sql`begin${config?.behavior ? ' ' + config.behavior : ''}`);
        this.run(drizzleOrm.sql `begin`);
        try {
            result = transaction(tx);
            this.run(drizzleOrm.sql `commit`);
        }
        catch (err) {
            this.run(drizzleOrm.sql `rollback`);
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
    var _a;
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
        const tablesConfig = relations.extractTablesRelationalConfig(config.schema, relations.createTableRelationsHelpers);
        schema = {
            fullSchema: config.schema,
            schema: tablesConfig.tables,
            tableNamesMap: tablesConfig.tableNamesMap
        };
    }
    const session = new OPSQLiteSession(client, dialect$1, schema, { logger: logger$1 });
    const db = new OPSQLiteDatabase('sync', dialect$1, session, schema);
    db.$client = client;
    db.$cache = config.cache;
    if (db.$cache) {
        db.$cache['invalidate'] = (_a = config.cache) === null || _a === void 0 ? void 0 : _a.onMutate;
    }
    return db;
}

exports.drizzle = drizzle;
