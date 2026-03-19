const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS — Thai ISPs often can't resolve SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Global plugin: add `id` string field to every lean() result
// so frontend code that uses `.id` keeps working (was integer in SQLite, now ObjectId string)
mongoose.plugin(function addIdPlugin(schema) {
    schema.set('toJSON', {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id;
            return ret;
        }
    });
    schema.set('toObject', {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id;
            return ret;
        }
    });
});

// Monkey-patch lean() to add `id` from `_id` on plain objects
const origLean = mongoose.Query.prototype.lean;
mongoose.Query.prototype.lean = function (...args) {
    const query = origLean.apply(this, args);
    const origExec = query.exec;
    query.exec = async function (...a) {
        const result = await origExec.apply(this, a);
        function addId(obj) {
            if (!obj) return obj;
            if (Array.isArray(obj)) return obj.map(addId);
            if (obj._id) obj.id = obj._id;
            return obj;
        }
        return addId(result);
    };
    // Also patch .then so await works directly
    const origThen = query.then;
    query.then = function (resolve, reject) {
        return origThen.call(this, (result) => {
            function addId(obj) {
                if (!obj) return obj;
                if (Array.isArray(obj)) return obj.map(addId);
                if (obj._id) obj.id = obj._id;
                return obj;
            }
            if (resolve) return resolve(addId(result));
            return addId(result);
        }, reject);
    };
    return query;
};

async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');
}

module.exports = { connectDB };
