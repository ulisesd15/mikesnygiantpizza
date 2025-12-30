const sequelize = require('../config/database');
const User = require('./User');
const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Ingredient = require('./ingredient');
const Recipe = require('./recipe');

// ASSOCIATIONS
User.hasMany(Order);
Order.belongsTo(User);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

MenuItem.hasMany(OrderItem);
OrderItem.belongsTo(MenuItem);

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
