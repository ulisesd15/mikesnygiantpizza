// backend/models/menuItemDefaultTopping.js
module.exports = (sequelize, DataTypes) => {
  const MenuItemDefaultTopping = sequelize.define(
    'menuItemDefaultTopping',
    {
      menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ingredientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      isRemovable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: 'menu_item_default_toppings'
    }
  );

  return MenuItemDefaultTopping;
};
