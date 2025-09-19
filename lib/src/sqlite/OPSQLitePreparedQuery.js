var _a;
import { Column, getTableName, SQL } from 'drizzle-orm';
import { entityKind, is } from 'drizzle-orm/entity';
import { fillPlaceholders } from 'drizzle-orm/sql/sql';
import { ExecuteResultSync, SQLitePreparedQuery } from 'drizzle-orm/sqlite-core/session';
export class OPSQLitePreparedQuery extends SQLitePreparedQuery {
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
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeRawSync(this.query.sql, params);
        return new ExecuteResultSync(() => {
            return this.mapResult(rs, false);
        });
    }
    run(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
            const params = fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
        const params = fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
        const params = fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
        const params = fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        logger.logQuery(query.sql, params);
        const rows = db.executeSync(query.sql, params).rows || [];
        return customResultMapper(rows);
    }
    values(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        return this.db.executeRawSync(this.query.sql, params);
        // return await this.queryWithCache(this.query.sql, params, async () => {
        //   return await this.client.executeRawAsync(this.query.sql, params);
        // });
    }
    isResponseInArrayMode() {
        return this._isResponseInArrayMode;
    }
}
_a = entityKind;
OPSQLitePreparedQuery[_a] = 'OPSQLitePreparedQuery';
/**
 * Maps a database row object to a result object based on the provided column definitions.
 * It reconstructs the hierarchical structure of the result by following the specified paths for each field.
 * It also handles nullification of nested objects when joined tables are nullable.
 */
export function mapResultRow(columns, row, joinsNotNullableMap) {
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
    if (is(field, Column)) {
        return field;
    }
    else if (is(field, SQL)) {
        return field.decoder;
    }
    else {
        return field.sql.decoder;
    }
}
function updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap) {
    if (!joinsNotNullableMap || !is(field, Column) || path.length !== 2) {
        return;
    }
    const objectName = path[0];
    if (!(objectName in nullifyMap)) {
        // @ts-expect-error
        nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
        // @ts-expect-error
    }
    else if (typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== getTableName(field.table)) {
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
//# sourceMappingURL=OPSQLitePreparedQuery.js.map