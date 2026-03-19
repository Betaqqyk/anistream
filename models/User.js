const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:      { type: String, required: true, unique: true },
    email:         { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    avatar:        { type: String, default: '/images/default-avatar.png' },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// --------------- static helpers ---------------

const safeFields = '_id username email avatar role created_at';

userSchema.statics.findByIdSafe = async function (id) {
    return this.findById(id).select(safeFields).lean();
};

userSchema.statics.findByUsername = async function (username) {
    return this.findOne({ username }).lean();
};

userSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email }).lean();
};

userSchema.statics.getAll = async function () {
    return this.find().select(safeFields).sort({ created_at: -1 }).lean();
};

module.exports = mongoose.model('User', userSchema);
