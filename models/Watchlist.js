const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    anime_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true },
    status:   { type: String, enum: ['want', 'watching', 'completed', 'on_hold'], default: 'want' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

watchlistSchema.index({ user_id: 1, anime_id: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
