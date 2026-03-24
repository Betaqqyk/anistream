const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        if (allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, gif, webp, svg)'));
        }
    }
});

// POST /api/upload — auth users only
router.post('/', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ไม่มีไฟล์' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
});

module.exports = router;
