const { getDb } = require('../database/db');

class Anime {
    static findById(id) {
        const db = getDb();
        const anime = db.prepare('SELECT * FROM anime WHERE id = ?').get(id);
        if (anime) {
            anime.genres = db.prepare(
                `SELECT g.* FROM genres g
                 JOIN anime_genres ag ON g.id = ag.genre_id
                 WHERE ag.anime_id = ?`
            ).all(id);
        }
        return anime;
    }

    static getAll({ limit = 20, offset = 0, status, genre, year, studio, search, sort = 'rating' } = {}) {
        const db = getDb();
        let query = 'SELECT DISTINCT a.* FROM anime a';
        let where = [];
        let params = [];

        if (genre) {
            query += ' JOIN anime_genres ag ON a.id = ag.anime_id JOIN genres g ON ag.genre_id = g.id';
            where.push('g.slug = ?');
            params.push(genre);
        }
        if (status) { where.push('a.status = ?'); params.push(status); }
        if (year) { where.push('a.year = ?'); params.push(year); }
        if (studio) { where.push('a.studio LIKE ?'); params.push(`%${studio}%`); }
        if (search) {
            where.push('(a.title LIKE ? OR a.title_en LIKE ? OR a.synopsis LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (where.length > 0) query += ' WHERE ' + where.join(' AND ');

        const sortMap = {
            'rating': 'a.rating DESC',
            'year': 'a.year DESC',
            'title': 'a.title ASC',
            'latest': 'a.created_at DESC'
        };
        query += ` ORDER BY ${sortMap[sort] || 'a.rating DESC'}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return db.prepare(query).all(...params);
    }

    static getByStatus(status, limit = 20) {
        const db = getDb();
        return db.prepare('SELECT * FROM anime WHERE status = ? ORDER BY rating DESC LIMIT ?').all(status, limit);
    }

    static getTopRated(limit = 20) {
        const db = getDb();
        return db.prepare('SELECT * FROM anime ORDER BY rating DESC LIMIT ?').all(limit);
    }

    static getLatest(limit = 20) {
        const db = getDb();
        return db.prepare('SELECT * FROM anime ORDER BY created_at DESC LIMIT ?').all(limit);
    }

    static getFeatured() {
        const db = getDb();
        return db.prepare('SELECT * FROM anime ORDER BY rating DESC LIMIT 5').all();
    }

    static getRelated(animeId, limit = 8) {
        const db = getDb();
        return db.prepare(
            `SELECT DISTINCT a.* FROM anime a
             JOIN anime_genres ag1 ON a.id = ag1.anime_id
             WHERE ag1.genre_id IN (
                 SELECT genre_id FROM anime_genres WHERE anime_id = ?
             ) AND a.id != ?
             ORDER BY a.rating DESC LIMIT ?`
        ).all(animeId, animeId, limit);
    }

    static create(data) {
        const db = getDb();
        const stmt = db.prepare(
            `INSERT INTO anime (title, title_en, synopsis, cover_image, banner_image, trailer_url, rating, status, year, season, studio, total_episodes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const result = stmt.run(
            data.title, data.title_en, data.synopsis, data.cover_image,
            data.banner_image, data.trailer_url, data.rating || 0,
            data.status || 'airing', data.year, data.season, data.studio,
            data.total_episodes || 0
        );
        if (data.genre_ids && data.genre_ids.length > 0) {
            const genreStmt = db.prepare('INSERT OR IGNORE INTO anime_genres (anime_id, genre_id) VALUES (?, ?)');
            data.genre_ids.forEach(gid => genreStmt.run(result.lastInsertRowid, gid));
        }
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const db = getDb();
        const fields = [];
        const params = [];
        ['title', 'title_en', 'synopsis', 'cover_image', 'banner_image', 'trailer_url',
         'rating', 'status', 'year', 'season', 'studio', 'total_episodes'].forEach(key => {
            if (data[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(data[key]);
            }
        });
        if (fields.length > 0) {
            params.push(id);
            db.prepare(`UPDATE anime SET ${fields.join(', ')} WHERE id = ?`).run(...params);
        }
        if (data.genre_ids) {
            db.prepare('DELETE FROM anime_genres WHERE anime_id = ?').run(id);
            const genreStmt = db.prepare('INSERT OR IGNORE INTO anime_genres (anime_id, genre_id) VALUES (?, ?)');
            data.genre_ids.forEach(gid => genreStmt.run(id, gid));
        }
        return this.findById(id);
    }

    static delete(id) {
        const db = getDb();
        return db.prepare('DELETE FROM anime WHERE id = ?').run(id);
    }

    static search(q, limit = 20) {
        const db = getDb();
        return db.prepare(
            `SELECT * FROM anime WHERE title LIKE ? OR title_en LIKE ?
             ORDER BY rating DESC LIMIT ?`
        ).all(`%${q}%`, `%${q}%`, limit);
    }
}

module.exports = Anime;
