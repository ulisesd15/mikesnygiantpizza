// backend/models/recipe.js
module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define(
    'Recipe',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'MenuItems',
          key: 'id'
        }
      },
      ingredientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Ingredients',
          key: 'id'
        }
      },
      quantityRequired: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 1.000
      }
    },
    {
      tableName: 'Recipes',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['menuItemId', 'ingredientId']
        }
      ]
    }
  );

  Recipe.associate = (models) => {
    Recipe.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });

    Recipe.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  return Recipe;
};