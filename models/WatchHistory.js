const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
    user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    episode_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Episode', required: true },
    progress_seconds: { type: Number, default: 0 },
    completed:        { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

watchHistorySchema.index({ user_id: 1, episode_id: 1 }, { unique: true });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
