// backend/models/recipe.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define('Recipe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantityRequired: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 1.000
    },
    menuItemId: {  // FK - was missing!
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'MenuItems',
        key: 'id'
      }
    },
    ingredientId: {  // FK - was missing!
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Ingredients',
        key: 'id'
      }
    }
  }, {
    tableName: 'Recipes',
    timestamps: true,  // createdAt/updatedAt matches table
    underscored: false // Uses camelCase (matches schema)
  });

  Recipe.associate = (models) => {
    Recipe.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId'
    });
    
    Recipe.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId'
    });
  };


  return Recipe;
};
