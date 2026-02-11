const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
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
  }, {
    tableName: 'Recipes'  // ✅ Explicit
  });

  // Recipe.associate = (models) => {
  //   // Recipe belongs to MenuItem (one recipe per menu item)
  //   Recipe.belongsTo(models.MenuItem, {
  //     foreignKey: 'menuItemId'
  //   });
    
  //   // Recipe belongs to Ingredient (one ingredient per recipe line)
  //   Recipe.belongsTo(models.Ingredient, {
  //     foreignKey: 'ingredientId'
  //   });
  // };

  return Recipe;
};
