<<<<<<< HEAD
// database.js
// -------------------------------------------------------------
// Database connection configuration for the backend.
// This file creates and exports a single Sequelize instance used
// by all models and routes to connect to the MySQL database.
// Environment variables are used to keep credentials separate
// from the source code.
// -------------------------------------------------------------
=======
//backend/config/database.js
>>>>>>> f27cf17630115a01a3a2426aacfb1122472b2043
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
<<<<<<< HEAD
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'mikes_pizza',
=======
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME ,
>>>>>>> f27cf17630115a01a3a2426aacfb1122472b2043
  logging: false  // Set true to see SQL queries
});


module.exports = sequelize;  // ✅ Sequelize INSTANCE
