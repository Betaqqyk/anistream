const express = require('express');
const router = express.Router();
const { Anime, Rating } = require('../../models');
const { sequelize } = require('../../database/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validateAnime, validateRating } = require('../../middleware/validate');

// GET /api/anime — list with filters + pagination
router.get('/', async (req, res) => {
    try {
        const { limit, offset, status, genre, year, studio, search, sort } = req.query;
        const lim = parseInt(limit) || 20;
        const off = parseInt(offset) || 0;
        const animeList = await Anime.getAll({
            limit: lim, offset: off,
            status, genre, year: year ? parseInt(year) : null, studio, search, sort
        });
        // Return total count for pagination
        const total = await Anime.count();
        res.json({ data: animeList, total, limit: lim, offset: off });
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

// GET /api/anime/genres/all
router.get('/genres/all', async (req, res) => {
    try {
        const [rows] = await sequelize.query(`
            SELECT DISTINCT jt.genre AS slug
            FROM anime,
            JSON_TABLE(genres, '$[*]' COLUMNS (genre VARCHAR(100) PATH '$')) AS jt
            ORDER BY jt.genre
        `);
        const genres = rows.map(r => ({
            slug: r.slug,
            name: r.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        }));
        res.json(genres);
    } catch (err) {
        try {
            const allAnime = await Anime.findAll({ attributes: ['genres'], raw: true });
            const genreSet = new Set();
            allAnime.forEach(a => {
                const g = typeof a.genres === 'string' ? JSON.parse(a.genres) : a.genres;
                if (Array.isArray(g)) g.forEach(slug => genreSet.add(slug));
            });
            const genres = [...genreSet].sort().map(slug => ({
                slug,
                name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            }));
            res.json(genres);
        } catch (fallbackErr) {
            res.status(500).json({ error: fallbackErr.message });
        }
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
        if (!anime) return res.status(404).json({ error: 'ไม่พบอนิเมะ' });
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

// GET /api/anime/:id/ratings — get average + user's rating
router.get('/:id/ratings', async (req, res) => {
    try {
        const animeId = req.params.id;
        const userId = req.query.user_id;
        const result = await Rating.findAll({
            where: { anime_id: animeId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('score')), 'average'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            raw: true
        });
        const avg = result[0]?.average ? parseFloat(parseFloat(result[0].average).toFixed(1)) : 0;
        const count = parseInt(result[0]?.count) || 0;
        let userScore = null;
        if (userId) {
            const userRating = await Rating.findOne({
                where: { anime_id: animeId, user_id: userId },
                raw: true
            });
            userScore = userRating?.score || null;
        }
        res.json({ average: avg, count, userScore });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/anime/:id/rate
router.post('/:id/rate', requireAuth, validateRating, async (req, res) => {
    try {
        const { score } = req.body;
        await Rating.upsert({
            user_id: req.user.id,
            anime_id: req.params.id,
            score
        });
        // Recalculate average
        const result = await Rating.findAll({
            where: { anime_id: req.params.id },
            attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'average']],
            raw: true
        });
        const newAvg = parseFloat(parseFloat(result[0].average).toFixed(1));
        await Anime.update({ rating: newAvg }, { where: { id: req.params.id } });
        res.json({ success: true, average: newAvg, userScore: score });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/anime — admin
router.post('/', requireAdmin, validateAnime, async (req, res) => {
    try {
        const anime = await Anime.create(req.body);
        res.status(201).json(anime.get({ plain: true }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/anime/:id — admin
router.put('/:id', requireAdmin, validateAnime, async (req, res) => {
    try {
        await Anime.update(req.body, { where: { id: req.params.id } });
        const anime = await Anime.findByPk(req.params.id, { raw: true });
        res.json(anime);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/anime/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await Anime.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
