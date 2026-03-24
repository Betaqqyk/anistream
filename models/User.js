const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const User = sequelize.define('User', {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username:      { type: DataTypes.STRING(100), allowNull: false, unique: true },
    email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    avatar:        { type: DataTypes.STRING(500), defaultValue: '/images/default-avatar.png' },
    role:          { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    membership:    { type: DataTypes.ENUM('free', 'vip', 'svip'), defaultValue: 'free' }
}, { tableName: 'users' });

// --------------- Static helpers ---------------

const safeAttributes = ['id', 'username', 'email', 'avatar', 'role', 'membership', 'created_at'];

User.findByIdSafe = async function (id) {
    return this.findByPk(id, { attributes: safeAttributes, raw: true });
};

User.findByUsername = async function (username) {
    return this.findOne({ where: { username }, raw: true });
};

User.findByEmail = async function (email) {
    return this.findOne({ where: { email }, raw: true });
};

User.getAll = async function () {
    return this.findAll({ attributes: safeAttributes, order: [['created_at', 'DESC']], raw: true });
};

module.exports = User;
