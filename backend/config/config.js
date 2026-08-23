//backend/config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || 'mikes_pizza_test',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.PROD_DB_USER || process.env.DB_USER,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_NAME || 'mikes_pizza_prod',
    use_env_variable: 'DATABASE_URL', //add database url for production
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    dialect: 'mysql'
  }
};