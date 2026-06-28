// database.js
// -------------------------------------------------------------
// Database connection configuration for the backend.
// This file creates and exports a single Sequelize instance used
// by all models and routes to connect to the MySQL database.
// Environment variables are used to keep credentials separate
// from the source code.
// -------------------------------------------------------------
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'mikes_pizza',
  logging: false  // Set true to see SQL queries
});


module.exports = sequelize;  // ✅ Sequelize INSTANCE
