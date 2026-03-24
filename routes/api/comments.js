const express = require('express');
const router = express.Router();
const { Comment, User } = require('../../models');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validateComment } = require('../../middleware/validate');

// GET /api/comments/episode/:episodeId
router.get('/episode/:episodeId', async (req, res) => {
    try {
        res.json(await Comment.getByEpisode(req.params.episodeId));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/comments  (admin)
router.get('/', async (req, res) => {
    try {
        res.json(await Comment.getAllAdmin());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/comments — require auth
router.post('/', requireAuth, validateComment, async (req, res) => {
    try {
        const { episode_id, content } = req.body;
        const comment = await Comment.create({
            user_id: req.user.id,
            episode_id,
            content: content.trim()
        });
        const full = await Comment.findByPk(comment.id, {
            include: [{ model: User, as: 'user', attributes: ['username', 'avatar'] }]
        });
        const plain = full.get({ plain: true });
        res.status(201).json({
            ...plain,
            username: plain.user?.username || '',
            avatar:   plain.user?.avatar || ''
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/comments/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await Comment.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
