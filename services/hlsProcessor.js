const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Set fluent-ffmpeg to use the static binary from @ffmpeg-installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Converts a video file to HLS format (.m3u8 and .ts files)
 */
function convertToHLS(inputPath, outputDir, resolution = '720p') {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const m3u8Path = path.join(outputDir, 'index.m3u8');

        ffmpeg(inputPath)
            .outputOptions([
                '-c:v copy',      // Copy original video stream (Keeps 4K, NO quality loss, extremely fast)
                '-c:a copy',      // Copy original audio stream
                '-hls_time 10',   // 10 second chunks
                '-hls_playlist_type vod'
            ])
            .output(m3u8Path)
            .on('end', () => {
                console.log('✅ FFmpeg finished creating HLS');
                resolve(outputDir);
            })
            .on('error', (err) => {
                console.error('⚠️ FFmpeg error:', err);
                reject(err);
            })
            .run();
    });
}

/**
 * Zips an entire directory into a single .zip file
 */
function zipDirectory(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        // Use level: 0 (Store only) because video files (.ts) are already highly compressed.
        // This makes zipping instantaneous instead of taking 10-20 minutes!
        const archive = archiver('zip', { zlib: { level: 0 } });
        const stream = fs.createWriteStream(outPath);

        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve(outPath));
        archive.finalize();
    });
}

module.exports = {
    convertToHLS,
    zipDirectory
};
