const { getDb } = require('../database/db');

class Comment {
    static getByEpisode(episodeId, limit = 50) {
        const db = getDb();
        return db.prepare(
            `SELECT c.*, u.username, u.avatar FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.episode_id = ?
             ORDER BY c.created_at DESC LIMIT ?`
        ).all(episodeId, limit);
    }

    static create({ user_id, episode_id, content }) {
        const db = getDb();
        const stmt = db.prepare('INSERT INTO comments (user_id, episode_id, content) VALUES (?, ?, ?)');
        const result = stmt.run(user_id, episode_id, content);
        return db.prepare(
            `SELECT c.*, u.username, u.avatar FROM comments c
             JOIN users u ON c.user_id = u.id WHERE c.id = ?`
        ).get(result.lastInsertRowid);
    }

    static delete(id) {
        const db = getDb();
        return db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    }

    static getAll(limit = 100) {
        const db = getDb();
        return db.prepare(
            `SELECT c.*, u.username, e.title as episode_title, a.title as anime_title
             FROM comments c
             JOIN users u ON c.user_id = u.id
             JOIN episodes e ON c.episode_id = e.id
             JOIN anime a ON e.anime_id = a.id
             ORDER BY c.created_at DESC LIMIT ?`
        ).all(limit);
    }
}

module.exports = Comment;
