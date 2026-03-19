const express = require('express');
const router = express.Router();
const Episode = require('../../models/Episode');
const WatchHistory = require('../../models/WatchHistory');

// GET /api/episodes/latest
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        res.json(await Episode.getLatestEpisodes(limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/episodes/anime/:animeId
router.get('/anime/:animeId', async (req, res) => {
    try {
        const userId = req.query.user_id;
        const animeId = req.params.animeId;

        const episodes = await Episode.getByAnime(animeId);

        if (userId) {
            // Attach progress info
            const history = await WatchHistory.find({ user_id: userId, episode_id: { $in: episodes.map(e => e._id) } }).lean();
            const histMap = {};
            history.forEach(h => { histMap[h.episode_id.toString()] = h; });
            const enriched = episodes.map(ep => ({
                ...ep,
                progress: histMap[ep._id.toString()]?.progress_seconds || 0,
                watched:  histMap[ep._id.toString()]?.completed ? 1 : 0
            }));
            return res.json(enriched);
        }

        res.json(episodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/episodes/:id
router.get('/:id', async (req, res) => {
    try {
        const episode = await Episode.findByIdWithAnime(req.params.id);
        if (!episode) return res.status(404).json({ error: 'Episode not found' });
        res.json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/episodes
router.post('/', async (req, res) => {
    try {
        const episode = await Episode.create(req.body);
        res.status(201).json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/episodes/:id
router.put('/:id', async (req, res) => {
    try {
        const episode = await Episode.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        res.json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/episodes/:id
router.delete('/:id', async (req, res) => {
    try {
        await Episode.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
