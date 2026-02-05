const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'kimpembe',
  database: process.env.DB_NAME || 'mikes_pizza',
  logging: false  // Set true to see SQL queries
});


module.exports = sequelize;  // ✅ Sequelize INSTANCE
