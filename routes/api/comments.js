const express = require('express');
const router = express.Router();
const Comment = require('../../models/Comment');

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

// POST /api/comments
router.post('/', async (req, res) => {
    try {
        const { user_id, episode_id, content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const comment = await Comment.create({ user_id, episode_id, content: content.trim() });
        const populated = await Comment.findById(comment._id)
            .populate('user_id', 'username avatar')
            .lean();
        res.status(201).json({
            ...populated,
            username: populated.user_id?.username || '',
            avatar:   populated.user_id?.avatar || ''
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/comments/:id
router.delete('/:id', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
