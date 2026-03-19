const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Watchlist = require('../../models/Watchlist');
const WatchHistory = require('../../models/WatchHistory');
const Episode = require('../../models/Episode');

// POST /api/users/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (await User.findByUsername(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (await User.findByEmail(email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const password_hash = bcrypt.hashSync(password, 10);
        const user = await User.create({ username, email, password_hash });
        const { password_hash: _, ...safeUser } = user.toObject();
        res.status(201).json(safeUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findByUsername(username);
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
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByIdSafe(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;
        const completedHistory = await WatchHistory.find({ user_id: userId, completed: true }).lean();
        const episodeIds = completedHistory.map(h => h.episode_id);
        const episodes = await Episode.find({ _id: { $in: episodeIds } }).select('duration').lean();
        const totalSeconds = episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0);
        res.json({
            episodes_watched: completedHistory.length,
            days_watched: Math.round((totalSeconds / 86400) * 10) / 10
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/watchlist
router.get('/:id/watchlist', async (req, res) => {
    try {
        const filter = { user_id: req.params.id };
        if (req.query.status) filter.status = req.query.status;
        const list = await Watchlist.find(filter)
            .sort({ created_at: -1 })
            .populate('anime_id', 'title cover_image rating status')
            .lean();
        const result = list.map(w => ({
            ...w,
            title:        w.anime_id?.title || '',
            cover_image:  w.anime_id?.cover_image || '',
            rating:       w.anime_id?.rating || 0,
            anime_status: w.anime_id?.status || ''
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/watchlist
router.post('/:id/watchlist', async (req, res) => {
    try {
        const { anime_id, status } = req.body;
        await Watchlist.findOneAndUpdate(
            { user_id: req.params.id, anime_id },
            { status: status || 'want' },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id/watchlist/:animeId
router.delete('/:id/watchlist/:animeId', async (req, res) => {
    try {
        await Watchlist.findOneAndDelete({ user_id: req.params.id, anime_id: req.params.animeId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/history
router.get('/:id/history', async (req, res) => {
    try {
        const history = await WatchHistory.find({ user_id: req.params.id })
            .sort({ updated_at: -1 })
            .limit(50)
            .populate({
                path: 'episode_id',
                select: 'number title duration anime_id',
                populate: { path: 'anime_id', select: 'title cover_image' }
            })
            .lean();
        const result = history.map(h => ({
            ...h,
            number:        h.episode_id?.number || 0,
            episode_title: h.episode_id?.title || '',
            duration:      h.episode_id?.duration || 0,
            anime_id:      h.episode_id?.anime_id?._id || null,
            anime_title:   h.episode_id?.anime_id?.title || '',
            cover_image:   h.episode_id?.anime_id?.cover_image || ''
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/history
router.post('/:id/history', async (req, res) => {
    try {
        const { episode_id, progress_seconds, completed } = req.body;
        await WatchHistory.findOneAndUpdate(
            { user_id: req.params.id, episode_id },
            { progress_seconds: progress_seconds || 0, completed: !!completed },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
