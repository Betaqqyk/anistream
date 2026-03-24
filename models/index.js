const { sequelize } = require('../database/db');
const Anime        = require('./Anime');
const Episode      = require('./Episode');
const User         = require('./User');
const Comment      = require('./Comment');
const WatchHistory = require('./WatchHistory');
const Watchlist    = require('./Watchlist');
const Rating       = require('./Rating');
const Notification = require('./Notification');

// ─── Associations ───

// Anime → Episodes
Anime.hasMany(Episode,   { foreignKey: 'anime_id', as: 'episodes' });
Episode.belongsTo(Anime, { foreignKey: 'anime_id', as: 'anime' });

// User → Comments
User.hasMany(Comment,    { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });

// Episode → Comments
Episode.hasMany(Comment,    { foreignKey: 'episode_id', as: 'comments' });
Comment.belongsTo(Episode,  { foreignKey: 'episode_id', as: 'episode' });

// User → WatchHistory
User.hasMany(WatchHistory,      { foreignKey: 'user_id' });
WatchHistory.belongsTo(User,    { foreignKey: 'user_id' });
Episode.hasMany(WatchHistory,   { foreignKey: 'episode_id' });
WatchHistory.belongsTo(Episode, { foreignKey: 'episode_id', as: 'episode' });

// User → Watchlist
User.hasMany(Watchlist,    { foreignKey: 'user_id' });
Watchlist.belongsTo(User,  { foreignKey: 'user_id' });
Anime.hasMany(Watchlist,   { foreignKey: 'anime_id' });
Watchlist.belongsTo(Anime, { foreignKey: 'anime_id', as: 'anime' });

// User → Ratings
User.hasMany(Rating,     { foreignKey: 'user_id' });
Rating.belongsTo(User,   { foreignKey: 'user_id' });
Anime.hasMany(Rating,    { foreignKey: 'anime_id' });
Rating.belongsTo(Anime,  { foreignKey: 'anime_id' });

// User → Notifications
User.hasMany(Notification,    { foreignKey: 'user_id' });
Notification.belongsTo(User,  { foreignKey: 'user_id' });

module.exports = { sequelize, Anime, Episode, User, Comment, WatchHistory, Watchlist, Rating, Notification };
