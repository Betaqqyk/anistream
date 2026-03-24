const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Watchlist, WatchHistory, Episode, Anime, Notification } = require('../../models');
const { generateToken, requireAuth } = require('../../middleware/auth');
const { validateRegister, validateLogin } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');

// GET /api/users  (admin — list all users)
router.get('/', async (req, res) => {
    try {
        res.json(await User.getAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/register
router.post('/register', authLimiter, validateRegister, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (await User.findByUsername(username)) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
        }
        if (await User.findByEmail(email)) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
        }
        const password_hash = bcrypt.hashSync(password, 10);
        const user = await User.create({ username, email, password_hash });
        const { password_hash: _, ...safeUser } = user.get({ plain: true });
        const token = generateToken(safeUser);
        res.status(201).json({ ...safeUser, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findByUsername(username);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
        const { password_hash, ...safeUser } = user;
        const token = generateToken(safeUser);
        res.json({ ...safeUser, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/me — get current user from token
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findByIdSafe(req.user.id);
        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByIdSafe(req.params.id);
        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', requireAuth, async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขข้อมูลผู้อื่น' });
        }
        await User.update(req.body, { where: { id: req.params.id } });
        const updatedUser = await User.findByIdSafe(req.params.id);
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;
        const completedHistory = await WatchHistory.findAll({
            where: { user_id: userId, completed: true },
            raw: true
        });
        const episodeIds = completedHistory.map(h => h.episode_id);
        let totalSeconds = 0;
        if (episodeIds.length > 0) {
            const episodes = await Episode.findAll({
                where: { id: episodeIds },
                attributes: ['duration'],
                raw: true
            });
            totalSeconds = episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0);
        }
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
        const where = { user_id: req.params.id };
        if (req.query.status) where.status = req.query.status;
        const list = await Watchlist.findAll({
            where,
            order: [['created_at', 'DESC']],
            include: [{ model: Anime, as: 'anime', attributes: ['title', 'cover_image', 'rating', 'status'] }]
        });
        const result = list.map(w => {
            const plain = w.get({ plain: true });
            return {
                ...plain,
                title:        plain.anime?.title || '',
                cover_image:  plain.anime?.cover_image || '',
                rating:       plain.anime?.rating || 0,
                anime_status: plain.anime?.status || ''
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/watchlist
router.post('/:id/watchlist', requireAuth, async (req, res) => {
    try {
        const { anime_id, status } = req.body;
        await Watchlist.upsert({
            user_id: req.params.id,
            anime_id,
            status: status || 'want'
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id/watchlist/:animeId
router.delete('/:id/watchlist/:animeId', requireAuth, async (req, res) => {
    try {
        await Watchlist.destroy({ where: { user_id: req.params.id, anime_id: req.params.animeId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/history
router.get('/:id/history', async (req, res) => {
    try {
        const history = await WatchHistory.findAll({
            where: { user_id: req.params.id },
            order: [['updated_at', 'DESC']],
            limit: 50,
            include: [{
                model: Episode, as: 'episode',
                attributes: ['number', 'title', 'duration', 'anime_id'],
                include: [{ model: Anime, as: 'anime', attributes: ['title', 'cover_image'] }]
            }]
        });
        const result = history.map(h => {
            const plain = h.get({ plain: true });
            return {
                ...plain,
                number:        plain.episode?.number || 0,
                episode_title: plain.episode?.title || '',
                duration:      plain.episode?.duration || 0,
                anime_id:      plain.episode?.anime_id || null,
                anime_title:   plain.episode?.anime?.title || '',
                cover_image:   plain.episode?.anime?.cover_image || ''
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/history
router.post('/:id/history', async (req, res) => {
    try {
        const { episode_id, progress_seconds, completed } = req.body;
        await WatchHistory.upsert({
            user_id: req.params.id,
            episode_id,
            progress_seconds: progress_seconds || 0,
            completed: !!completed
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/notifications
router.get('/:id/notifications', requireAuth, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.params.id },
            order: [['created_at', 'DESC']],
            limit: 50,
            raw: true
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/notifications/unread-count
router.get('/:id/notifications/unread-count', requireAuth, async (req, res) => {
    try {
        const count = await Notification.count({
            where: { user_id: req.params.id, is_read: false }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/notifications/read-all
router.put('/:id/notifications/read-all', requireAuth, async (req, res) => {
    try {
        await Notification.update({ is_read: true }, {
            where: { user_id: req.params.id, is_read: false }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
