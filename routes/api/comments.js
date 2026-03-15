const express = require('express');
const router = express.Router();
const Comment = require('../../models/Comment');

// GET /api/comments/episode/:episodeId
router.get('/episode/:episodeId', (req, res) => {
    try {
        res.json(Comment.getByEpisode(parseInt(req.params.episodeId)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/comments  (admin)
router.get('/', (req, res) => {
    try {
        res.json(Comment.getAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/comments
router.post('/', (req, res) => {
    try {
        const { user_id, episode_id, content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const comment = Comment.create({ user_id, episode_id, content: content.trim() });
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/comments/:id
router.delete('/:id', (req, res) => {
    try {
        Comment.delete(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
