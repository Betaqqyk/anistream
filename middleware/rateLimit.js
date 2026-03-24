const rateLimit = require('express-rate-limit');

// Auth routes: 10 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'คำขอมากเกินไป กรุณารอ 15 นาที' },
    standardHeaders: true,
    legacyHeaders: false
});

// General API: 100 requests per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };
