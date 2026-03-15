const { getDb } = require('../database/db');

class User {
    static findById(id) {
        const db = getDb();
        return db.prepare('SELECT id, username, email, avatar, role, created_at FROM users WHERE id = ?').get(id);
    }

    static findByUsername(username) {
        const db = getDb();
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }

    static findByEmail(email) {
        const db = getDb();
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    static create({ username, email, password_hash }) {
        const db = getDb();
        const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
        const result = stmt.run(username, email, password_hash);
        return this.findById(result.lastInsertRowid);
    }

    static updateAvatar(id, avatar) {
        const db = getDb();
        db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, id);
        return this.findById(id);
    }

    static getStats(userId) {
        const db = getDb();
        const episodes = db.prepare(
            'SELECT COUNT(*) as count FROM watch_history WHERE user_id = ? AND completed = 1'
        ).get(userId);
        const totalTime = db.prepare(
            `SELECT COALESCE(SUM(e.duration), 0) as total_seconds
             FROM watch_history wh
             JOIN episodes e ON wh.episode_id = e.id
             WHERE wh.user_id = ? AND wh.completed = 1`
        ).get(userId);
        return {
            episodes_watched: episodes.count,
            days_watched: Math.round((totalTime.total_seconds / 86400) * 10) / 10
        };
    }

    static getAll() {
        const db = getDb();
        return db.prepare('SELECT id, username, email, avatar, role, created_at FROM users ORDER BY created_at DESC').all();
    }
}

module.exports = User;
