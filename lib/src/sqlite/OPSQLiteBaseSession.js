var _a, _b;
import { entityKind } from 'drizzle-orm/entity';
import { NoopLogger } from 'drizzle-orm/logger';
import { SQLiteSession, SQLiteTransaction } from 'drizzle-orm/sqlite-core/session';
import { OPSQLitePreparedQuery } from './OPSQLitePreparedQuery.js';
import { NoopCache } from 'drizzle-orm/cache/core';
export class OPSQLiteTransaction extends SQLiteTransaction {
}
_a = entityKind;
OPSQLiteTransaction[_a] = 'OPSQLiteTransaction';
export class OPSQLiteBaseSession extends SQLiteSession {
    constructor(db, dialect, relations, schema, options = {}) {
        var _c, _d;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.relations = relations;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new NoopLogger();
        this.cache = (_d = options.cache) !== null && _d !== void 0 ? _d : new NoopCache();
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
_b = entityKind;
OPSQLiteBaseSession[_b] = 'OPSQLiteBaseSession';
