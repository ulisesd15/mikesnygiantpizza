// backend/models/ingredient.js
// -------------------------------------------------------------
// Ingredient model.
// Stores inventory ingredients and toppings, including current stock,
// reorder level, unit type, unit cost, and supplier information.
// Ingredients are used for pizza toppings, menu defaults, topping
// prices, and future recipe/inventory tracking.
// -------------------------------------------------------------

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
    Ingredient.belongsToMany(models.MenuItem, {
      through: models.MenuItemDefaultTopping || 'menu_item_default_toppings',
      foreignKey: 'ingredientId',
      otherKey: 'menuItemId',
      as: 'defaultOnPizzas'
    });

    Ingredient.hasMany(models.MenuItemDefaultTopping, {
      foreignKey: 'ingredientId',
      as: 'defaultToppingRows'
    });

    Ingredient.hasMany(models.PizzaToppingPrice, {
      foreignKey: 'ingredientId',
      as: 'toppingPrices'
    });

    Ingredient.hasMany(models.Recipe, {
      foreignKey: 'ingredientId',
      as: 'recipes'
    });
  };

  return Ingredient;
};