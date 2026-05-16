// backend/models/menuitemdefaulttopping.js
module.exports = (sequelize, DataTypes) => {
  const MenuItemDefaultTopping = sequelize.define(
    'MenuItemDefaultTopping',
    {
      menuItemId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'MenuItems',  // ✅ Match MenuItem.tableName
          key: 'id'
        }
      },
      ingredientId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'Ingredients',  // ✅ Match Ingredient.tableName
          key: 'id'
        }
      },
      // NEW ADMIN FIELDS:
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      isOptional: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      canRemove: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      canAddExtra: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      }
    },
    {
      tableName: 'menu_item_default_toppings',
      timestamps: true,
      indexes: [
        { fields: ['menuItemId', 'ingredientId'], unique: true }
      ]
    }
  );

  MenuItemDefaultTopping.associate = (models) => {
    MenuItemDefaultTopping.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });

    MenuItemDefaultTopping.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  return MenuItemDefaultTopping;
};