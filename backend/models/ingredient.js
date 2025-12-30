const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  unit: {
    type: DataTypes.STRING, // 'kg', 'pieces', 'liters'
    defaultValue: 'pieces'
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  supplier: DataTypes.STRING
});

module.exports = Ingredient;
