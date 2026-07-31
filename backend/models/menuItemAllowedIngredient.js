//backend/models/menuItemAllowedIngredient.js
module.exports = (sequelize, DataTypes) => {
  const MenuItemAllowedIngredient = sequelize.define(
    'MenuItemAllowedIngredient',
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
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maxQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      }
    },
    {
      tableName: 'MenuItemAllowedIngredients',
      timestamps: true,
      indexes: [
        { fields: ['menuItemId'] },
        { fields: ['ingredientId'] },
        { fields: ['displayOrder'] },
        { unique: true, fields: ['menuItemId', 'ingredientId'] }
      ]
    }
  );

  MenuItemAllowedIngredient.associate = (models) => {
    MenuItemAllowedIngredient.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });

    MenuItemAllowedIngredient.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  return MenuItemAllowedIngredient;
};