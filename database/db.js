const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'anime.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;
let dbReady = null;

// Wrapper that provides a better-sqlite3 compatible API on top of sql.js
class DbWrapper {
    constructor(sqlDb) {
        this._db = sqlDb;
    }

    prepare(sql) {
        const self = this;
        return {
            run(...params) {
                self._db.run(sql, params);
                const changes = self._db.getRowsModified();
                const lastId = self._db.exec("SELECT last_insert_rowid() as id");
                const lastInsertRowid = lastId.length > 0 ? lastId[0].values[0][0] : 0;
                self._save();
                return { changes, lastInsertRowid };
            },
            get(...params) {
                const stmt = self._db.prepare(sql);
                stmt.bind(params);
                let row = null;
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                }
                stmt.free();
                return row;
            },
            all(...params) {
                const results = [];
                const stmt = self._db.prepare(sql);
                stmt.bind(params);
                while (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    results.push(row);
                }
                stmt.free();
                return results;
            }
        };
    }

    exec(sql) {
        this._db.exec(sql);
        this._save();
    }

    pragma(str) {
        try {
            this._db.exec(`PRAGMA ${str}`);
        } catch (e) {
            // Ignore unsupported pragmas
        }
    }

    _save() {
        try {
            const data = this._db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(DB_PATH, buffer);
        } catch (e) {
            // Swallow save errors silently
        }
    }
}

async function initDb() {
    const SQL = await initSqlJs();

    let sqlDb;
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(fileBuffer);
    } else {
        sqlDb = new SQL.Database();
    }

    db = new DbWrapper(sqlDb);
    db.pragma('foreign_keys = ON');

    // Run schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    // Execute statements one by one
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
        try {
            db._db.exec(stmt + ';');
        } catch (e) {
            // Ignore errors for IF NOT EXISTS etc
        }
    }
    db._save();

    return db;
}

// Promise that resolves when DB is ready
dbReady = initDb();

function getDb() {
    if (!db) {
        throw new Error('Database not initialized yet. Await getDbAsync() first.');
    }
    return db;
}

async function getDbAsync() {
    if (!db) {
        await dbReady;
    }
    return db;
}

module.exports = { getDb, getDbAsync, dbReady };
