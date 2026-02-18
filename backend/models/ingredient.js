const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {  // ✅ Factory wrapper
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
      type: DataTypes.STRING,
      defaultValue: 'pieces'
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    supplier: DataTypes.STRING
  }, {
    tableName: 'Ingredients'  // ✅ Explicit
  });

  

  return Ingredient;
};
