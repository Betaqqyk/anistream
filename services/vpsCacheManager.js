const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { downloadFileFromTelegram } = require('./telegramService');

const CACHE_DIR = path.join(__dirname, '../uploads/vps_cache');
// Keep track of when each episode was last accessed
const activeStreams = new Map();

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Gets the localized HLS file path, downloading from Telegram if necessary.
 */
async function getOrDownloadCache(telegramMessageId) {
    const epCacheDir = path.join(CACHE_DIR, String(telegramMessageId));
    const zipPath = path.join(CACHE_DIR, `${telegramMessageId}.zip`);
    const indexPath = path.join(epCacheDir, 'index.m3u8');

    // Update last accessed time
    activeStreams.set(String(telegramMessageId), Date.now());

    // If cache already exists and unzipped, return true
    if (fs.existsSync(indexPath)) {
        return epCacheDir;
    }

    console.log(`[VPS Cache] Cache miss for Telegram ID ${telegramMessageId}. Downloading from Telegram...`);

    try {
        // Download Zip from Telegram
        await downloadFileFromTelegram(telegramMessageId, zipPath);
        
        console.log(`[VPS Cache] Downloaded zip to ${zipPath}. Extracting...`);
        // Extract Zip
        await extract(zipPath, { dir: epCacheDir });
        
        console.log(`[VPS Cache] Extracted HLS files to ${epCacheDir}.`);
        
        // Cleanup the raw downloaded zip to save space
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        return epCacheDir;
    } catch (err) {
        console.error(`[VPS Cache] Failed to download or extract cache for Telegram ID ${telegramMessageId}:`, err);
        throw err;
    }
}

/**
 * Update access time for a specific file ping
 */
function touchCache(telegramMessageId) {
    activeStreams.set(String(telegramMessageId), Date.now());
}

/**
 * Background worker to clean up inactive streams.
 * Removes folders that haven't been accessed in X milliseconds.
 */
function startCleanupJob(inactiveThresholdMs = 2 * 60 * 60 * 1000 /* 2 hours */) {
    setInterval(() => {
        const now = Date.now();
        activeStreams.forEach((lastAccess, messageId) => {
            if (now - lastAccess > inactiveThresholdMs) {
                console.log(`[VPS Cache] Telegram ID ${messageId} has been inactive. Cleaning up...`);
                
                const epCacheDir = path.join(CACHE_DIR, String(messageId));
                if (fs.existsSync(epCacheDir)) {
                    fs.rmSync(epCacheDir, { recursive: true, force: true });
                }
                
                activeStreams.delete(messageId);
            }
        });
    }, 15 * 60 * 1000); // Check every 15 minutes
}

module.exports = {
    getOrDownloadCache,
    touchCache,
    startCleanupJob,
    CACHE_DIR
};
