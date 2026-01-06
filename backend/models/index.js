const sequelize = require('../config/database');



const User = require('./User');
const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Ingredient = require('./ingredient');
const Recipe = require('./recipe');

// ASSOCIATIONS
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });

MenuItem.belongsToMany(Ingredient, { through: 'Recipes' });
Ingredient.belongsToMany(MenuItem, { through: 'Recipes' });

module.exports = {
  sequelize,
  User,
  MenuItem,
  Order,
  OrderItem,
  Ingredient,
  Recipe
};
