const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../database/db');

const Anime = sequelize.define('Anime', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title:          { type: DataTypes.STRING(255), allowNull: false },
    title_en:       { type: DataTypes.STRING(255), defaultValue: '' },
    synopsis:       { type: DataTypes.TEXT, defaultValue: '' },
    cover_image:    { type: DataTypes.STRING(500), defaultValue: '' },
    banner_image:   { type: DataTypes.STRING(500), defaultValue: '' },
    trailer_url:    { type: DataTypes.STRING(500), defaultValue: '' },
    rating:         { type: DataTypes.FLOAT, defaultValue: 0 },
    status:         { type: DataTypes.ENUM('airing', 'completed', 'upcoming'), defaultValue: 'airing' },
    year:           { type: DataTypes.INTEGER },
    season:         { type: DataTypes.ENUM('winter', 'spring', 'summer', 'fall') },
    studio:         { type: DataTypes.STRING(255), defaultValue: '' },
    total_episodes: { type: DataTypes.INTEGER, defaultValue: 0 },
    genres:         { type: DataTypes.JSON, defaultValue: [] }   // ['action','fantasy',...]
}, { tableName: 'anime' });

// --------------- Helpers ---------------

// Sequelize returns JSON columns as strings when raw: true — parse them
function parseGenres(row) {
    if (row && typeof row.genres === 'string') {
        try { row.genres = JSON.parse(row.genres); } catch { row.genres = []; }
    }
    return row;
}
function parseRows(rows) { return rows.map(parseGenres); }

// --------------- Static helpers ---------------

Anime.findByIdSafe = async function (id) {
    return parseGenres(await this.findByPk(id, { raw: true }));
};

Anime.getAll = async function ({ limit = 20, offset = 0, status, genre, year, studio, search, sort = 'rating' } = {}) {
    const where = {};
    if (status) where.status = status;
    if (year)   where.year = year;
    if (studio) where.studio = { [Op.like]: `%${studio}%` };
    if (search) {
        where[Op.or] = [
            { title:    { [Op.like]: `%${search}%` } },
            { title_en: { [Op.like]: `%${search}%` } },
            { synopsis: { [Op.like]: `%${search}%` } }
        ];
    }
    // Genre filter via JSON_CONTAINS
    if (genre) {
        where[Op.and] = sequelize.literal(`JSON_CONTAINS(genres, '"${genre}"')`);
    }

    const sortMap = {
        rating: [['rating', 'DESC']],
        year:   [['year', 'DESC']],
        title:  [['title', 'ASC']],
        latest: [['created_at', 'DESC']]
    };

    return parseRows(await this.findAll({
        where, order: sortMap[sort] || [['rating', 'DESC']],
        offset, limit, raw: true
    }));
};

Anime.getByStatus = async function (status, limit = 20) {
    return parseRows(await this.findAll({ where: { status }, order: [['rating', 'DESC']], limit, raw: true }));
};

Anime.getTopRated = async function (limit = 20) {
    return parseRows(await this.findAll({ order: [['rating', 'DESC']], limit, raw: true }));
};

Anime.getLatest = async function (limit = 20) {
    return parseRows(await this.findAll({ order: [['created_at', 'DESC']], limit, raw: true }));
};

Anime.getFeatured = async function () {
    return parseRows(await this.findAll({ order: [['rating', 'DESC']], limit: 5, raw: true }));
};

Anime.getRelated = async function (animeId, limit = 8) {
    const anime = parseGenres(await this.findByPk(animeId, { raw: true }));
    if (!anime || !anime.genres || !anime.genres.length) return [];
    // Find anime sharing at least one genre
    const genreConditions = anime.genres.map(g => sequelize.literal(`JSON_CONTAINS(genres, '"${g}"')`));
    return parseRows(await this.findAll({
        where: {
            id: { [Op.ne]: animeId },
            [Op.or]: genreConditions
        },
        order: [['rating', 'DESC']], limit, raw: true
    }));
};

Anime.search = async function (q, limit = 20) {
    return parseRows(await this.findAll({
        where: {
            [Op.or]: [
                { title:    { [Op.like]: `%${q}%` } },
                { title_en: { [Op.like]: `%${q}%` } }
            ]
        },
        order: [['rating', 'DESC']], limit, raw: true
    }));
};

module.exports = Anime;
