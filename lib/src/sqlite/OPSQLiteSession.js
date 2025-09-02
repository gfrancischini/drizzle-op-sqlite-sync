var _a;
import { entityKind } from 'drizzle-orm/entity';
import { OPSQLiteBaseSession, OPSQLiteTransaction } from './OPSQLiteBaseSession.js';
import { sql } from 'drizzle-orm';
export class OPSQLiteSession extends OPSQLiteBaseSession {
    constructor(db, dialect, schema, options = {}) {
        super(db, dialect, schema, options);
        this.client = db;
    }
    transaction(transaction, config = {}) {
        let result;
        const tx = new OPSQLiteTransaction('sync', this.dialect, new OPSQLiteBaseSession(this.client, this.dialect, this.schema, this.options), this.schema);
        //this.run(sql`begin${config?.behavior ? ' ' + config.behavior : ''}`);
        this.run(sql `begin`);
        try {
            result = transaction(tx);
            this.run(sql `commit`);
        }
        catch (err) {
            this.run(sql `rollback`);
            throw err;
        }
        return result;
    }
}
_a = entityKind;
OPSQLiteSession[_a] = 'OPSQLiteSession';
