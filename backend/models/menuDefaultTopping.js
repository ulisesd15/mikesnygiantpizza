// backend/models/menuItemDefaultTopping.js
module.exports = (sequelize, DataTypes) => {
  const MenuItemDefaultTopping = sequelize.define(
    'MenuItemDefaultTopping',
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
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      canRemove: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      canAddExtra: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'MenuItemDefaultToppings',
      timestamps: true,
      indexes: [
        { fields: ['menuItemId'] },
        { fields: ['ingredientId'] },
        { fields: ['displayOrder'] },
        { unique: true, fields: ['menuItemId', 'ingredientId'] }
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