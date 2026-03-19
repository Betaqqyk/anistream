const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
    title:          { type: String, required: true },
    title_en:       { type: String, default: '' },
    synopsis:       { type: String, default: '' },
    cover_image:    { type: String, default: '' },
    banner_image:   { type: String, default: '' },
    trailer_url:    { type: String, default: '' },
    rating:         { type: Number, default: 0 },
    status:         { type: String, enum: ['airing', 'completed', 'upcoming'], default: 'airing' },
    year:           { type: Number },
    season:         { type: String, enum: ['winter', 'spring', 'summer', 'fall'] },
    studio:         { type: String, default: '' },
    total_episodes: { type: Number, default: 0 },
    genres:         [{ type: String }]           // e.g. ['action','fantasy']
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Text index for search
animeSchema.index({ title: 'text', title_en: 'text', synopsis: 'text' });
animeSchema.index({ status: 1 });
animeSchema.index({ year: 1 });
animeSchema.index({ rating: -1 });

// --------------- static helpers (match old API) ---------------

animeSchema.statics.findByIdSafe = async function (id) {
    return this.findById(id).lean();
};

animeSchema.statics.getAll = async function ({ limit = 20, offset = 0, status, genre, year, studio, search, sort = 'rating' } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (genre)  filter.genres = genre;           // genre slug stored directly
    if (year)   filter.year = year;
    if (studio) filter.studio = { $regex: studio, $options: 'i' };
    if (search) {
        filter.$or = [
            { title:    { $regex: search, $options: 'i' } },
            { title_en: { $regex: search, $options: 'i' } },
            { synopsis: { $regex: search, $options: 'i' } }
        ];
    }

    const sortMap = {
        rating: { rating: -1 },
        year:   { year: -1 },
        title:  { title: 1 },
        latest: { created_at: -1 }
    };

    return this.find(filter)
        .sort(sortMap[sort] || { rating: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
};

animeSchema.statics.getByStatus = async function (status, limit = 20) {
    return this.find({ status }).sort({ rating: -1 }).limit(limit).lean();
};

animeSchema.statics.getTopRated = async function (limit = 20) {
    return this.find().sort({ rating: -1 }).limit(limit).lean();
};

animeSchema.statics.getLatest = async function (limit = 20) {
    return this.find().sort({ created_at: -1 }).limit(limit).lean();
};

animeSchema.statics.getFeatured = async function () {
    return this.find().sort({ rating: -1 }).limit(5).lean();
};

animeSchema.statics.getRelated = async function (animeId, limit = 8) {
    const anime = await this.findById(animeId).lean();
    if (!anime || !anime.genres.length) return [];
    return this.find({
        _id: { $ne: animeId },
        genres: { $in: anime.genres }
    }).sort({ rating: -1 }).limit(limit).lean();
};

animeSchema.statics.search = async function (q, limit = 20) {
    return this.find({
        $or: [
            { title:    { $regex: q, $options: 'i' } },
            { title_en: { $regex: q, $options: 'i' } }
        ]
    }).sort({ rating: -1 }).limit(limit).lean();
};

module.exports = mongoose.model('Anime', animeSchema);
