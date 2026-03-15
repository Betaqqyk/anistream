const express = require('express');
const router = express.Router();
const Anime = require('../../models/Anime');
const { getDb } = require('../../database/db');

// GET /api/anime — list with filters
router.get('/', (req, res) => {
    try {
        const { limit, offset, status, genre, year, studio, search, sort } = req.query;
        const animeList = Anime.getAll({
            limit: parseInt(limit) || 20,
            offset: parseInt(offset) || 0,
            status, genre, year: year ? parseInt(year) : null, studio, search, sort
        });
        res.json(animeList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/featured
router.get('/featured', (req, res) => {
    try {
        res.json(Anime.getFeatured());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/top-rated
router.get('/top-rated', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(Anime.getTopRated(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/airing
router.get('/airing', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(Anime.getByStatus('airing', limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/latest
router.get('/latest', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(Anime.getLatest(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/search?q=...
router.get('/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        res.json(Anime.search(q));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/:id
router.get('/:id', (req, res) => {
    try {
        const anime = Anime.findById(parseInt(req.params.id));
        if (!anime) return res.status(404).json({ error: 'Anime not found' });
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/:id/related
router.get('/:id/related', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        res.json(Anime.getRelated(parseInt(req.params.id), limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/anime
router.post('/', (req, res) => {
    try {
        const anime = Anime.create(req.body);
        res.status(201).json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/anime/:id
router.put('/:id', (req, res) => {
    try {
        const anime = Anime.update(parseInt(req.params.id), req.body);
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/anime/:id
router.delete('/:id', (req, res) => {
    try {
        Anime.delete(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/genres/all
router.get('/genres/all', (req, res) => {
    try {
        const db = getDb();
        const genres = db.prepare('SELECT * FROM genres ORDER BY name').all();
        res.json(genres);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
