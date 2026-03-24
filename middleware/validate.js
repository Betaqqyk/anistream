const { body, validationResult } = require('express-validator');

// Run validation and return errors
function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
}

// ─── Auth validations ───
const validateRegister = [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _'),
    body('email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    handleValidation
];

const validateLogin = [
    body('username').trim().notEmpty().withMessage('กรุณาใส่ชื่อผู้ใช้'),
    body('password').notEmpty().withMessage('กรุณาใส่รหัสผ่าน'),
    handleValidation
];

// ─── Anime validations ───
const validateAnime = [
    body('title').trim().notEmpty().withMessage('กรุณาใส่ชื่ออนิเมะ'),
    body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('คะแนนต้องอยู่ระหว่าง 0-10'),
    body('year').optional().isInt({ min: 1950, max: 2030 }).withMessage('ปีไม่ถูกต้อง'),
    body('status').optional().isIn(['airing', 'completed', 'upcoming']).withMessage('สถานะไม่ถูกต้อง'),
    handleValidation
];

// ─── Episode validations ───
const validateEpisode = [
    body('anime_id').notEmpty().withMessage('กรุณาเลือกอนิเมะ'),
    body('number').isInt({ min: 1 }).withMessage('หมายเลขตอนต้องมากกว่า 0'),
    body('duration').optional().isInt({ min: 0 }).withMessage('ความยาวต้องเป็นจำนวนเต็มบวก'),
    handleValidation
];

// ─── Comment validation ───
const validateComment = [
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('ความคิดเห็นต้องมี 1-1000 ตัวอักษร'),
    body('episode_id').notEmpty().withMessage('กรุณาระบุตอน'),
    handleValidation
];

// ─── Rating validation ───
const validateRating = [
    body('score').isFloat({ min: 1, max: 10 }).withMessage('คะแนนต้องอยู่ระหว่าง 1-10'),
    handleValidation
];

module.exports = {
    validateRegister, validateLogin,
    validateAnime, validateEpisode,
    validateComment, validateRating,
    handleValidation
};
