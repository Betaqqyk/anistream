require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'anistream',
    process.env.MYSQL_USER     || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
        host:    process.env.MYSQL_HOST || '127.0.0.1',
        port:    parseInt(process.env.MYSQL_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
            underscored: true,           // snake_case column names
            createdAt:   'created_at',
            updatedAt:   'updated_at'
        },
        pool: {
            max:     10,
            min:     0,
            acquire: 30000,
            idle:    10000
        }
    }
);

async function connectDB() {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');
}

module.exports = { sequelize, connectDB };
