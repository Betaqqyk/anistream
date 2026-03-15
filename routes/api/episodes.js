const express = require('express');
const router = express.Router();
const Episode = require('../../models/Episode');

// GET /api/episodes/latest
router.get('/latest', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(Episode.getLatestEpisodes(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/episodes/anime/:animeId
router.get('/anime/:animeId', (req, res) => {
    try {
        const userId = parseInt(req.query.user_id) || 0;
        const animeId = parseInt(req.params.animeId);
        if (userId) {
            res.json(Episode.getWithProgress(animeId, userId));
        } else {
            res.json(Episode.getByAnime(animeId));
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/episodes/:id
router.get('/:id', (req, res) => {
    try {
        const episode = Episode.findById(parseInt(req.params.id));
        if (!episode) return res.status(404).json({ error: 'Episode not found' });
        res.json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/episodes
router.post('/', (req, res) => {
    try {
        const episode = Episode.create(req.body);
        res.status(201).json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/episodes/:id
router.put('/:id', (req, res) => {
    try {
        const episode = Episode.update(parseInt(req.params.id), req.body);
        res.json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/episodes/:id
router.delete('/:id', (req, res) => {
    try {
        Episode.delete(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
