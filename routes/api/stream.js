const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { getOrDownloadCache, touchCache } = require('../../services/vpsCacheManager');
const { Episode } = require('../../models');

// GET /api/stream/:episodeId/:file
router.get('/:episodeId/:file', async (req, res) => {
    try {
        const episodeId = parseInt(req.params.episodeId);
        const fileName = req.params.file;

        // Basic security check to prevent directory traversal
        if (fileName.includes('..') || fileName.includes('/')) {
            return res.status(403).send('Forbidden');
        }

        // Get the episode to find the telegram message ID
        const episode = await Episode.findByPk(episodeId);
        if (!episode) return res.status(404).send('Episode not found');

        let messageId = null;
        if (episode.video_url && episode.video_url.startsWith('telegram:')) {
            messageId = episode.video_url.split(':')[1];
        } else {
            return res.status(400).send('Not a telegram cached episode');
        }

        // 1. Get cache directory (will trigger download & unzip if not exists)
        // Note: For the first user, this might block and take a while.
        // During download, we only let ONE request do the downloading.
        // Simplification for now: wait for download. 
        // A robust solution would use a lock or Promise caching.
        const epCacheDir = await getOrDownloadCache(messageId);

        // 2. Serve the requested file
        const filePath = path.join(epCacheDir, fileName);
        if (fs.existsSync(filePath)) {
            // Touch the cache to reset the inactive timer
            touchCache(messageId);
            
            // Set HLS CORS and Cache headers
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cache-Control', 'public, max-age=3600');
            
            if (fileName.endsWith('.m3u8')) {
                res.set('Content-Type', 'application/vnd.apple.mpegurl');
            } else if (fileName.endsWith('.ts')) {
                res.set('Content-Type', 'video/MP2T');
            }

            // Stream the file
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } else {
            res.status(404).send('Segment not found');
        }

    } catch (err) {
        console.error('[Stream] Stream error:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
