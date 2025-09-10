var _a, _b;
import { entityKind } from 'drizzle-orm/entity';
import { NoopLogger } from 'drizzle-orm/logger';
import { SQLiteSession, SQLiteTransaction } from 'drizzle-orm/sqlite-core/session';
import { OPSQLitePreparedQuery } from './OPSQLitePreparedQuery.js';
export class OPSQLiteTransaction extends SQLiteTransaction {
}
_a = entityKind;
OPSQLiteTransaction[_a] = 'OPSQLiteTransaction';
export class OPSQLiteBaseSession extends SQLiteSession {
    constructor(db, dialect, schema, options = {}) {
        var _c;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new NoopLogger();
    }
    prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
        return new OPSQLitePreparedQuery(this.db, query, this.logger, fields, executeMethod, isResponseInArrayMode, customResultMapper);
    }
    transaction(_transaction, _config = {}) {
        throw new Error('Nested transactions are not supported');
    }
}
_b = entityKind;
OPSQLiteBaseSession[_b] = 'OPSQLiteBaseSession';
