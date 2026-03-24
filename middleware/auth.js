const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'anistream_secret_key_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, membership: user.membership },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

// Middleware: require authentication
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }
    try {
        const token = header.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
}

// Middleware: require admin role
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
        }
        next();
    });
}

module.exports = { generateToken, requireAuth, requireAdmin, JWT_SECRET };
