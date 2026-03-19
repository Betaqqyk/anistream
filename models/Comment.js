const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    episode_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode', required: true },
    content:    { type: String, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

commentSchema.index({ episode_id: 1 });

// --------------- static helpers ---------------

commentSchema.statics.getByEpisode = async function (episodeId, limit = 50) {
    return this.find({ episode_id: episodeId })
        .sort({ created_at: -1 })
        .limit(limit)
        .populate('user_id', 'username avatar')
        .lean()
        .then(docs => docs.map(d => ({
            ...d,
            username: d.user_id?.username || '',
            avatar:   d.user_id?.avatar || ''
        })));
};

commentSchema.statics.getAllAdmin = async function (limit = 100) {
    const docs = await this.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .populate('user_id', 'username')
        .populate({
            path: 'episode_id',
            select: 'title anime_id',
            populate: { path: 'anime_id', select: 'title' }
        })
        .lean();

    return docs.map(d => ({
        ...d,
        username:      d.user_id?.username || '',
        episode_title: d.episode_id?.title || '',
        anime_title:   d.episode_id?.anime_id?.title || ''
    }));
};

module.exports = mongoose.model('Comment', commentSchema);
