const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database/db');
const { sequelize } = require('./models');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limit API
app.use('/api/', apiLimiter);

const { initTelegramClient } = require('./services/telegramService');
const { startCleanupJob } = require('./services/vpsCacheManager');

// API Routes
app.use('/api/anime', require('./routes/api/anime'));
app.use('/api/episodes', require('./routes/api/episodes'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/comments', require('./routes/api/comments'));
app.use('/api/upload', require('./routes/api/upload'));
app.use('/api/upload_video', require('./routes/api/upload_video')); // NEW
app.use('/api/stream', require('./routes/api/stream')); // NEW

// SPA-style fallback for HTML pages
app.get('/:page.html', (req, res) => {
    const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
    res.sendFile(filePath, err => {
        if (err) res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    });
});

// 404 catch-all
app.use((req, res) => {
    if (req.accepts('html')) {
        return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
    res.status(404).json({ error: 'Not found' });
});

// Connect to MySQL then start server
(async () => {
    try {
        await connectDB();
        await sequelize.sync();
        console.log('✅ Database synced');
        
        // Init Telegram Client
        await initTelegramClient();
        
        // Start VPS Cache cleanup background job
        startCleanupJob();
        
        app.listen(PORT, () => {
            console.log(`🚀 02HUB server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('⚠️  Startup error:', err.message);
        app.listen(PORT, () => {
            console.log(`🚀 02HUB server running at http://localhost:${PORT} (WITH ERRORS)`);
        });
    }
})();
