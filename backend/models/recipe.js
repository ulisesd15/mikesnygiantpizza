const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quantityRequired: {
    type: DataTypes.DECIMAL(10, 3), // e.g., 0.250 kg cheese per pizza
    allowNull: false,
    defaultValue: 1
  }
});

module.exports = Recipe;
