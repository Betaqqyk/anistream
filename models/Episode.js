const { getDb } = require('../database/db');

class Episode {
    static findById(id) {
        const db = getDb();
        return db.prepare(
            `SELECT e.*, a.title as anime_title, a.cover_image as anime_cover
             FROM episodes e JOIN anime a ON e.anime_id = a.id WHERE e.id = ?`
        ).get(id);
    }

    static getByAnime(animeId) {
        const db = getDb();
        return db.prepare('SELECT * FROM episodes WHERE anime_id = ? ORDER BY number ASC').all(animeId);
    }

    static getLatestEpisodes(limit = 20) {
        const db = getDb();
        return db.prepare(
            `SELECT e.*, a.title as anime_title, a.cover_image as anime_cover
             FROM episodes e JOIN anime a ON e.anime_id = a.id
             ORDER BY e.created_at DESC LIMIT ?`
        ).all(limit);
    }

    static create(data) {
        const db = getDb();
        const stmt = db.prepare(
            `INSERT INTO episodes (anime_id, number, title, thumbnail, video_url, duration)
             VALUES (?, ?, ?, ?, ?, ?)`
        );
        const result = stmt.run(data.anime_id, data.number, data.title, data.thumbnail, data.video_url, data.duration || 0);
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const db = getDb();
        const fields = [];
        const params = [];
        ['anime_id', 'number', 'title', 'thumbnail', 'video_url', 'duration'].forEach(key => {
            if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
        });
        if (fields.length > 0) {
            params.push(id);
            db.prepare(`UPDATE episodes SET ${fields.join(', ')} WHERE id = ?`).run(...params);
        }
        return this.findById(id);
    }

    static delete(id) {
        const db = getDb();
        return db.prepare('DELETE FROM episodes WHERE id = ?').run(id);
    }

    static getWithProgress(animeId, userId) {
        const db = getDb();
        return db.prepare(
            `SELECT e.*, COALESCE(wh.progress_seconds, 0) as progress, COALESCE(wh.completed, 0) as watched
             FROM episodes e
             LEFT JOIN watch_history wh ON e.id = wh.episode_id AND wh.user_id = ?
             WHERE e.anime_id = ?
             ORDER BY e.number ASC`
        ).all(userId, animeId);
    }
}

module.exports = Episode;
