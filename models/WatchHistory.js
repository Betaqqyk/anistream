const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const WatchHistory = sequelize.define('WatchHistory', {
    id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:          { type: DataTypes.INTEGER, allowNull: false },
    episode_id:       { type: DataTypes.INTEGER, allowNull: false },
    progress_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
    completed:        { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'watch_histories',
    indexes: [{ unique: true, fields: ['user_id', 'episode_id'] }]
});

module.exports = WatchHistory;
