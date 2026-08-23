// backend/models/menuItem.js
module.exports = (sequelize, DataTypes) => {
  const MenuItem = sequelize.define(
    'MenuItem',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM(
          'pizza',
          'salad',
          'calzone',
          'pasta',
          'hamburger',
          'sub',
          'wings',
          'nuggets',
          'calamari',
          'appetizer',
          'combo',
          'drink',
          'dessert',
          'side'
        ),
        allowNull: false
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'MenuItems',
      timestamps: true,
      indexes: [
        { fields: ['category'] },
        { fields: ['isAvailable'] },
        { fields: ['name'] }
      ]
    }
  );

  MenuItem.associate = (models) => {
    MenuItem.hasMany(models.OrderItem, {
      foreignKey: 'menuItemId',
      as: 'orderItems'
    });

    MenuItem.hasMany(models.Recipe, {
      foreignKey: 'menuItemId',
      as: 'recipes'
    });

    MenuItem.hasMany(models.CustomizationGroup, {
      foreignKey: 'menuItemId',
      as: 'customizationGroups'
    });

    MenuItem.belongsToMany(models.Ingredient, {
      through: models.Recipe,
      foreignKey: 'menuItemId',
      otherKey: 'ingredientId',
      as: 'recipeIngredients'
    });

    MenuItem.hasMany(models.MenuItemDefaultTopping, {
      foreignKey: 'menuItemId',
      as: 'defaultToppings'
    });

    MenuItem.belongsToMany(models.Ingredient, {
      through: models.MenuItemDefaultTopping,
      foreignKey: 'menuItemId',
      otherKey: 'ingredientId',
      as: 'defaultIngredients'
    });

    MenuItem.hasMany(models.MenuItemAllowedIngredient, {
      foreignKey: 'menuItemId',
      as: 'allowedIngredientLinks'
    });

    MenuItem.belongsToMany(models.Ingredient, {
      through: models.MenuItemAllowedIngredient,
      foreignKey: 'menuItemId',
      otherKey: 'ingredientId',
      as: 'allowedIngredients'
    });
  };

  return MenuItem;
};