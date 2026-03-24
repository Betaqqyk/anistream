const express = require('express');
const router = express.Router();
const { Episode, WatchHistory, Notification, Anime, Watchlist } = require('../../models');
const { requireAdmin } = require('../../middleware/auth');
const { validateEpisode } = require('../../middleware/validate');

const crypto = require('crypto');
const CDN_BASE = (process.env.VIDEO_CDN_BASE || '').replace(/\/+$/, '');
const SIGN_SECRET = process.env.CDN_SIGN_KEY || process.env.JWT_SECRET || '02hub_cdn_secret';

function resolveVideoUrl(ep) {
    if (!ep.video_url) return ep;
    let url = ep.video_url;

    // Generate 2-hour Token (if keeping external CDN token logic)
    const expires = Math.floor(Date.now() / 1000) + (2 * 60 * 60);

    // If it's a telegram cache reference
    if (url.startsWith('telegram:')) {
        const messageId = url.split(':')[1];
        // The player needs the index.m3u8 path
        ep.video_url = `/api/stream/${ep.id}/index.m3u8?token=placeholder`;
        return ep;
    }
    
    if (CDN_BASE && !/^https?:\/\//i.test(url)) {
        url = `${CDN_BASE}/${url.replace(/^\/+/, '')}`;
    }
    
    // Parse URL safely to get the path for hashing
    const uri = url.startsWith('/') ? url : (new URL(url, 'http://localhost')).pathname;
    const token = crypto.createHash('md5').update(`${uri}${expires}${SIGN_SECRET}`).digest('hex');
    
    // Append token query parameters
    const connector = url.includes('?') ? '&' : '?';
    ep.video_url = `${url}${connector}token=${token}&expires=${expires}`;
    
    return ep;
}

// GET /api/episodes/latest
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const eps = await Episode.getLatestEpisodes(limit);
        res.json(eps.map(resolveVideoUrl));
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

        if (userId && !isNaN(userId)) {
            const epIds = episodes.map(e => e.id);
            const history = await WatchHistory.findAll({
                where: { user_id: userId, episode_id: epIds },
                raw: true
            });
            const histMap = {};
            history.forEach(h => { histMap[h.episode_id] = h; });
            const enriched = episodes.map(ep => resolveVideoUrl({
                ...ep,
                progress: histMap[ep.id]?.progress_seconds || 0,
                watched:  histMap[ep.id]?.completed ? 1 : 0
            }));
            return res.json(enriched);
        }

        res.json(episodes.map(resolveVideoUrl));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/episodes/:id
router.get('/:id', async (req, res) => {
    try {
        const episode = await Episode.findByIdWithAnime(req.params.id);
        if (!episode) return res.status(404).json({ error: 'ไม่พบตอน' });
        res.json(resolveVideoUrl(episode));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/episodes — admin + send notifications
router.post('/', requireAdmin, validateEpisode, async (req, res) => {
    try {
        const episode = await Episode.create(req.body);
        const ep = episode.get({ plain: true });

        // Notify users who are watching this anime
        try {
            const anime = await Anime.findByPk(ep.anime_id, { attributes: ['title'], raw: true });
            if (anime) {
                const watchers = await Watchlist.findAll({
                    where: { anime_id: ep.anime_id, status: 'watching' },
                    attributes: ['user_id'],
                    raw: true
                });
                if (watchers.length > 0) {
                    const notifications = watchers.map(w => ({
                        user_id: w.user_id,
                        type: 'new_episode',
                        title: `${anime.title} ตอนที่ ${ep.number}`,
                        message: `ตอนใหม่มาแล้ว! ${ep.title || `ตอนที่ ${ep.number}`}`,
                        link: `/watch.html?anime_id=${ep.anime_id}&ep=${ep.number}`
                    }));
                    await Notification.bulkCreate(notifications);
                }
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr.message);
        }

        res.status(201).json(ep);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/episodes/:id — admin
router.put('/:id', requireAdmin, validateEpisode, async (req, res) => {
    try {
        await Episode.update(req.body, { where: { id: req.params.id } });
        const episode = await Episode.findByPk(req.params.id, { raw: true });
        res.json(episode);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/episodes/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await Episode.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
