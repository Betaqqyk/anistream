const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Episode = sequelize.define('Episode', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    anime_id:  { type: DataTypes.INTEGER, allowNull: false },
    number:    { type: DataTypes.INTEGER, allowNull: false },
    title:     { type: DataTypes.STRING(255), defaultValue: '' },
    thumbnail: { type: DataTypes.STRING(500), defaultValue: '' },
    video_url: { type: DataTypes.STRING(500), defaultValue: '' },   // Full URL or CDN path
    duration:  { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: 'episodes',
    indexes: [{ unique: true, fields: ['anime_id', 'number'] }]
});

// --------------- Static helpers ---------------

Episode.findByIdWithAnime = async function (id) {
    const Anime = require('./Anime');
    const ep = await this.findByPk(id, {
        include: [{ model: Anime, as: 'anime', attributes: ['title', 'cover_image'] }]
    });
    if (!ep) return null;
    const plain = ep.get({ plain: true });
    return {
        ...plain,
        anime_title: plain.anime?.title || '',
        anime_cover: plain.anime?.cover_image || ''
    };
};

Episode.getByAnime = async function (animeId) {
    return this.findAll({
        where: { anime_id: animeId },
        order: [['number', 'ASC']],
        raw: true
    });
};

Episode.getLatestEpisodes = async function (limit = 20) {
    const Anime = require('./Anime');
    const eps = await this.findAll({
        order: [['created_at', 'DESC']],
        limit,
        include: [{ model: Anime, as: 'anime', attributes: ['title', 'cover_image'] }]
    });
    return eps.map(ep => {
        const plain = ep.get({ plain: true });
        return {
            ...plain,
            anime_title: plain.anime?.title || '',
            anime_cover: plain.anime?.cover_image || ''
        };
    });
};

module.exports = Episode;
