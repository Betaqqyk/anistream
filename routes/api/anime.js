const express = require('express');
const router = express.Router();
const Anime = require('../../models/Anime');

// GET /api/anime — list with filters
router.get('/', async (req, res) => {
    try {
        const { limit, offset, status, genre, year, studio, search, sort } = req.query;
        const animeList = await Anime.getAll({
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
router.get('/featured', async (req, res) => {
    try {
        res.json(await Anime.getFeatured());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/top-rated
router.get('/top-rated', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(await Anime.getTopRated(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/airing
router.get('/airing', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(await Anime.getByStatus('airing', limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/latest
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(await Anime.getLatest(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/genres/all  — must be before /:id
router.get('/genres/all', async (req, res) => {
    try {
        // Aggregate unique genre slugs across all anime documents
        const result = await Anime.aggregate([
            { $unwind: '$genres' },
            { $group: { _id: '$genres' } },
            { $sort: { _id: 1 } }
        ]);
        const genres = result.map(r => ({ slug: r._id, name: r._id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
        res.json(genres);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/search?q=...
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        res.json(await Anime.search(q));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/:id
router.get('/:id', async (req, res) => {
    try {
        const anime = await Anime.findByIdSafe(req.params.id);
        if (!anime) return res.status(404).json({ error: 'Anime not found' });
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/anime/:id/related
router.get('/:id/related', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        res.json(await Anime.getRelated(req.params.id, limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/anime
router.post('/', async (req, res) => {
    try {
        const anime = await Anime.create(req.body);
        res.status(201).json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/anime/:id
router.put('/:id', async (req, res) => {
    try {
        const anime = await Anime.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/anime/:id
router.delete('/:id', async (req, res) => {
    try {
        await Anime.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
