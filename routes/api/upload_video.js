const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { requireAdmin } = require('../../middleware/auth');
const { convertToHLS, zipDirectory } = require('../../services/hlsProcessor');
const { uploadFileToTelegram } = require('../../services/telegramService');

const uploadDir = path.join(__dirname, '../../uploads/temp_video');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 4000 * 1024 * 1024 }, // 4GB max for MTProto
    fileFilter: (req, file, cb) => {
        const allowed = /\.(mp4|mkv|avi|mov)$/i;
        if (allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์วิดีโอ (mp4, mkv, avi, mov)'));
        }
    }
});

const jobs = new Map();

// GET /api/upload_video/status/:jobId
router.get('/status/:jobId', requireAdmin, (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

// GET /api/upload_video/ftp_files
router.get('/ftp_files', requireAdmin, (req, res) => {
    const ftpDir = path.join(__dirname, '../../uploads/ftp_inbox');
    if (!fs.existsSync(ftpDir)) fs.mkdirSync(ftpDir, { recursive: true });
    
    try {
        const files = fs.readdirSync(ftpDir).filter(f => /\.(mp4|mkv|avi|mov)$/i.test(f));
        const fileList = files.map(f => {
            const stat = fs.statSync(path.join(ftpDir, f));
            return { name: f, size: stat.size, time: stat.mtime };
        }).sort((a,b) => b.time - a.time);
        res.json(fileList);
    } catch(err) {
        res.status(500).json({ error: 'ไม่สามารถอ่านไฟล์ FTP ได้' });
    }
});

// POST /api/upload_video — admin only
router.post('/', requireAdmin, upload.single('video'), async (req, res) => {
    let inputPath = '';
    let isFtp = false;

    if (req.body.ftp_file) {
        inputPath = path.join(__dirname, '../../uploads/ftp_inbox', req.body.ftp_file);
        // Basic security check to prevent path traversal
        if (inputPath.indexOf(path.join(__dirname, '../../uploads/ftp_inbox')) !== 0) {
            return res.status(403).json({ error: 'Invalid path' });
        }
        if (!fs.existsSync(inputPath)) {
            return res.status(400).json({ error: 'ไม่พบไฟล์ใน FTP Inbox' });
        }
        isFtp = true;
    } else if (req.file) {
        inputPath = req.file.path;
    } else {
        return res.status(400).json({ error: 'กรุณาอัปโหลดไฟล์ หรือเลือกไฟล์จาก FTP' });
    }
    
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const hlsDir = path.join(__dirname, `../../uploads/hls_temp/${baseName}`);
    const zipPath = path.join(__dirname, `../../uploads/hls_temp/${baseName}.zip`);

    const jobId = baseName;
    jobs.set(jobId, { status: 'processing', message: 'กำลังแปลงไฟล์ HLS...' });

    // Respond immediately with Job ID
    res.json({ jobId, message: 'เริ่มประมวลผลแล้ว' });

    // Process in background
    (async () => {
        try {
            console.log(`[Upload] Starting HLS conversion for ${inputPath}`);
            await convertToHLS(inputPath, hlsDir);

            jobs.set(jobId, { status: 'processing', message: 'แปลงไฟล์สำเร็จ... กำลังบีบอัด Zip' });
            console.log(`[Upload] HLS created. Zipping directory...`);
            await zipDirectory(hlsDir, zipPath);

            jobs.set(jobId, { status: 'processing', message: 'กำลังอัปโหลดขึ้น Telegram (อาจใช้เวลาหลายนาที)...' });
            console.log(`[Upload] Uploading zip to Telegram...`);
            const originalName = req.file ? req.file.originalname : req.body.ftp_file;
            const messageId = await uploadFileToTelegram(zipPath, `${baseName}.zip`, `HLS Cache: ${originalName}`);

            console.log(`[Upload] Uploaded successfully! Telegram Message ID: ${messageId}`);
            jobs.set(jobId, { status: 'done', url: `telegram:${messageId}` });
            
            // --- NEW PRE-CACHE LOGIC ---
            // Instead of deleting the HLS files, we move them to vps_cache immediately!
            // This guarantees the 1st viewer has 0 wait time.
            const cacheDir = path.join(__dirname, `../../uploads/vps_cache/${messageId}`);
            if (!fs.existsSync(path.dirname(cacheDir))) fs.mkdirSync(path.dirname(cacheDir), { recursive: true });
            
            if (fs.existsSync(hlsDir)) {
                fs.renameSync(hlsDir, cacheDir);
                const { touchCache } = require('../../services/vpsCacheManager');
                touchCache(messageId); // initialize last access time
                console.log(`[Upload] Pre-cached HLS directly to ${cacheDir} for 0-second wait time!`);
            }
            // ---------------------------
            
        } catch (err) {
            console.error('[Upload] Processing failed:', err);
            jobs.set(jobId, { status: 'error', message: err.message });
        } finally {
            // Cleanup temp files
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
    })();
});

module.exports = router;
