const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Notification = sequelize.define('Notification', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:   { type: DataTypes.INTEGER, allowNull: false },
    type:      { type: DataTypes.ENUM('new_episode', 'system', 'reply'), defaultValue: 'system' },
    title:     { type: DataTypes.STRING(255), allowNull: false },
    message:   { type: DataTypes.TEXT, defaultValue: '' },
    link:      { type: DataTypes.STRING(500), defaultValue: '' },
    is_read:   { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'notifications',
    indexes: [{ fields: ['user_id', 'is_read'] }]
});

module.exports = Notification;
