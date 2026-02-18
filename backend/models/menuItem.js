const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
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
        'pizza', 'salad', 'calzone', 'pasta', 'hamburger', 
        'sub', 'wings', 'nuggets', 'calamari', 'appetizer', 
        'combo', 'drink', 'dessert', 'side'
      ),
      allowNull: false
    },
    imageUrl: DataTypes.STRING,
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'MenuItems'
  });

  MenuItem.associate = (models) => {
    if (models.OrderItem && !MenuItem.associations.OrderItems) {
      MenuItem.hasMany(models.OrderItem, {
        foreignKey: 'menuItemId',
        as: 'OrderItems',
        onDelete: 'NO ACTION'
      });
    }
    // Uncomment if Ingredient model exists
    // if (models.Ingredient && !MenuItem.associations.defaultToppings) {
    //   MenuItem.belongsToMany(models.Ingredient, {
    //     through: 'menu_item_default_toppings',
    //     foreignKey: 'menuItemId',
    //     otherKey: 'ingredientId',
    //     as: 'defaultToppings'
    //   });
    // }
  };

  return MenuItem;
};
