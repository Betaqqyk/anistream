const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
    anime_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true },
    number:     { type: Number, required: true },
    title:      { type: String, default: '' },
    thumbnail:  { type: String, default: '' },
    video_url:  { type: String, default: '' },
    duration:   { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

episodeSchema.index({ anime_id: 1, number: 1 }, { unique: true });

// --------------- static helpers ---------------

episodeSchema.statics.findByIdWithAnime = async function (id) {
    const ep = await this.findById(id).populate('anime_id', 'title cover_image').lean();
    if (!ep) return null;
    return {
        ...ep,
        anime_title: ep.anime_id?.title || '',
        anime_cover: ep.anime_id?.cover_image || ''
    };
};

episodeSchema.statics.getByAnime = async function (animeId) {
    return this.find({ anime_id: animeId }).sort({ number: 1 }).lean();
};

episodeSchema.statics.getLatestEpisodes = async function (limit = 20) {
    const eps = await this.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .populate('anime_id', 'title cover_image')
        .lean();
    return eps.map(ep => ({
        ...ep,
        anime_title: ep.anime_id?.title || '',
        anime_cover: ep.anime_id?.cover_image || ''
    }));
};

module.exports = mongoose.model('Episode', episodeSchema);
