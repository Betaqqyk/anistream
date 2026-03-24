const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Comment = sequelize.define('Comment', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:    { type: DataTypes.INTEGER, allowNull: false },
    episode_id: { type: DataTypes.INTEGER, allowNull: false },
    content:    { type: DataTypes.TEXT, allowNull: false }
}, {
    tableName: 'comments',
    indexes: [{ fields: ['episode_id'] }]
});

// --------------- Static helpers ---------------

Comment.getByEpisode = async function (episodeId, limit = 50) {
    const User = require('./User');
    const docs = await this.findAll({
        where: { episode_id: episodeId },
        order: [['created_at', 'DESC']],
        limit,
        include: [{ model: User, as: 'user', attributes: ['username', 'avatar'] }]
    });
    return docs.map(d => {
        const plain = d.get({ plain: true });
        return {
            ...plain,
            username: plain.user?.username || '',
            avatar:   plain.user?.avatar || ''
        };
    });
};

Comment.getAllAdmin = async function (limit = 100) {
    const User = require('./User');
    const Episode = require('./Episode');
    const Anime = require('./Anime');
    const docs = await this.findAll({
        order: [['created_at', 'DESC']],
        limit,
        include: [
            { model: User, as: 'user', attributes: ['username'] },
            { model: Episode, as: 'episode', attributes: ['title', 'anime_id'],
              include: [{ model: Anime, as: 'anime', attributes: ['title'] }]
            }
        ]
    });
    return docs.map(d => {
        const plain = d.get({ plain: true });
        return {
            ...plain,
            username:      plain.user?.username || '',
            episode_title: plain.episode?.title || '',
            anime_title:   plain.episode?.anime?.title || ''
        };
    });
};

module.exports = Comment;
