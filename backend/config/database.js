//backend/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME ,
  logging: false  // Set true to see SQL queries
});


module.exports = sequelize;  // ✅ Sequelize INSTANCE
