const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '/../config/config.js'))[env];

const db = {};

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      !file.endsWith('.test.js')
    );
  })
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));

    if (typeof modelFactory !== 'function') {
      throw new Error(`Model file "${file}" does not export a function`);
    }

    const model = modelFactory(sequelize, Sequelize.DataTypes);

    if (!model || !model.name) {
      throw new Error(`Model file "${file}" did not return a valid Sequelize model`);
    }

    db[model.name] = model;
  });

console.log('Loaded models:', Object.keys(db));

Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
    } catch (error) {
      throw new Error(`Association error in model "${modelName}": ${error.message}`);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;