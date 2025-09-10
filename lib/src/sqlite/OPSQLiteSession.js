var _a;
import { entityKind } from 'drizzle-orm/entity';
import { OPSQLiteBaseSession, OPSQLiteTransaction } from './OPSQLiteBaseSession.js';
export class OPSQLiteSession extends OPSQLiteBaseSession {
    constructor(db, dialect, schema, options = {}) {
        super(db, dialect, schema, options);
        this.client = db;
    }
    transaction(transaction, config = {}) {
        let result;
        const tx = new OPSQLiteTransaction('sync', this.dialect, new OPSQLiteBaseSession(this.client, this.dialect, this.schema, this.options), this.schema);
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
