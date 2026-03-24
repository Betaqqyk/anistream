const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Rating = sequelize.define('Rating', {
    id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:  { type: DataTypes.INTEGER, allowNull: false },
    anime_id: { type: DataTypes.INTEGER, allowNull: false },
    score:    { type: DataTypes.FLOAT, allowNull: false }
}, {
    tableName: 'ratings',
    indexes: [{ unique: true, fields: ['user_id', 'anime_id'] }]
});

module.exports = Rating;
