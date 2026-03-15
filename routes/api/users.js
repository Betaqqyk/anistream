const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { getDb } = require('../../database/db');

// POST /api/users/register
router.post('/register', (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (User.findByUsername(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (User.findByEmail(email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const password_hash = bcrypt.hashSync(password, 10);
        const user = User.create({ username, email, password_hash });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const user = User.findByUsername(username);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const { password_hash, ...safeUser } = user;
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
    try {
        const user = User.findById(parseInt(req.params.id));
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/stats
router.get('/:id/stats', (req, res) => {
    try {
        res.json(User.getStats(parseInt(req.params.id)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/watchlist
router.get('/:id/watchlist', (req, res) => {
    try {
        const db = getDb();
        const status = req.query.status;
        let query = `SELECT w.*, a.title, a.cover_image, a.rating, a.status as anime_status
                      FROM watchlist w JOIN anime a ON w.anime_id = a.id WHERE w.user_id = ?`;
        const params = [parseInt(req.params.id)];
        if (status) { query += ' AND w.status = ?'; params.push(status); }
        query += ' ORDER BY w.created_at DESC';
        res.json(db.prepare(query).all(...params));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/watchlist
router.post('/:id/watchlist', (req, res) => {
    try {
        const db = getDb();
        const { anime_id, status } = req.body;
        db.prepare(
            `INSERT INTO watchlist (user_id, anime_id, status) VALUES (?, ?, ?)
             ON CONFLICT(user_id, anime_id) DO UPDATE SET status = excluded.status`
        ).run(parseInt(req.params.id), anime_id, status || 'want');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id/watchlist/:animeId
router.delete('/:id/watchlist/:animeId', (req, res) => {
    try {
        const db = getDb();
        db.prepare('DELETE FROM watchlist WHERE user_id = ? AND anime_id = ?')
          .run(parseInt(req.params.id), parseInt(req.params.animeId));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/history
router.get('/:id/history', (req, res) => {
    try {
        const db = getDb();
        const history = db.prepare(
            `SELECT wh.*, e.number, e.title as episode_title, e.duration, e.anime_id,
                    a.title as anime_title, a.cover_image
             FROM watch_history wh
             JOIN episodes e ON wh.episode_id = e.id
             JOIN anime a ON e.anime_id = a.id
             WHERE wh.user_id = ?
             ORDER BY wh.updated_at DESC LIMIT 50`
        ).all(parseInt(req.params.id));
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/history
router.post('/:id/history', (req, res) => {
    try {
        const db = getDb();
        const { episode_id, progress_seconds, completed } = req.body;
        db.prepare(
            `INSERT INTO watch_history (user_id, episode_id, progress_seconds, completed, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, episode_id)
             DO UPDATE SET progress_seconds = excluded.progress_seconds,
                           completed = excluded.completed,
                           updated_at = CURRENT_TIMESTAMP`
        ).run(parseInt(req.params.id), episode_id, progress_seconds || 0, completed || 0);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
