const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/anime', require('./routes/api/anime'));
app.use('/api/episodes', require('./routes/api/episodes'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/comments', require('./routes/api/comments'));

// SPA-style fallback for HTML pages
app.get('/:page.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`));
});

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 02HUB server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
