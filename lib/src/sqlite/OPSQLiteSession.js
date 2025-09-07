var _a;
import { entityKind } from 'drizzle-orm/entity';
import { OPSQLiteBaseSession, OPSQLiteTransaction } from './OPSQLiteBaseSession.js';
export class OPSQLiteSession extends OPSQLiteBaseSession {
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
_a = entityKind;
OPSQLiteSession[_a] = 'OPSQLiteSession';
