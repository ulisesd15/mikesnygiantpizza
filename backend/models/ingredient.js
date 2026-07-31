// backend/models/ingredient.js
module.exports = (sequelize, DataTypes) => {
  const Ingredient = sequelize.define(
    'Ingredient',
    {
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
        allowNull: false,
        defaultValue: 0
      },
      reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pieces'
      },
      unitCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'Ingredients',
      timestamps: true
    }
  );

  Ingredient.associate = (models) => {
    Ingredient.hasMany(models.Recipe, {
      foreignKey: 'ingredientId',
      as: 'recipes'
    });

    Ingredient.belongsToMany(models.MenuItem, {
      through: models.Recipe,
      foreignKey: 'ingredientId',
      otherKey: 'menuItemId',
      as: 'recipeMenuItems'
    });

    Ingredient.hasMany(models.MenuItemDefaultTopping, {
      foreignKey: 'ingredientId',
      as: 'defaultToppingLinks'
    });

    Ingredient.belongsToMany(models.MenuItem, {
      through: models.MenuItemDefaultTopping,
      foreignKey: 'ingredientId',
      otherKey: 'menuItemId',
      as: 'defaultOnMenuItems'
    });

    Ingredient.hasMany(models.MenuItemAllowedIngredient, {
      foreignKey: 'ingredientId',
      as: 'allowedIngredientLinks'
    });

    Ingredient.belongsToMany(models.MenuItem, {
      through: models.MenuItemAllowedIngredient,
      foreignKey: 'ingredientId',
      otherKey: 'menuItemId',
      as: 'allowedOnMenuItems'
    });

    Ingredient.hasMany(models.IngredientExtraPrice, {
      foreignKey: 'ingredientId',
      as: 'extraPrices'
    });
  };

  return Ingredient;
};