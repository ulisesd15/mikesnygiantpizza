// backend/models/index.js
const sequelize = require('../config/database');

const User = require('./User');
const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Ingredient = require('./ingredient');
const Recipe = require('./recipe');

// DEFER ASSOCIATIONS until after all models are loaded
User.associate = function() {
  User.hasMany(Order, { foreignKey: 'UserId' });
};

Order.associate = function() {
  Order.belongsTo(User, { foreignKey: 'UserId' });
  Order.hasMany(OrderItem, { foreignKey: 'orderId' });
};

OrderItem.associate = function() {
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
  OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
};

MenuItem.associate = function() {
  MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });
  MenuItem.belongsToMany(Ingredient, { through: 'Recipes' });
};

Ingredient.associate = function() {
  Ingredient.belongsToMany(MenuItem, { through: 'Recipes' });
};

// Call associations after models are defined
Object.keys(module.exports).forEach(modelName => {
  if (module.exports[modelName].associate) {
    module.exports[modelName].associate(module.exports);
  }
});

module.exports = {
  sequelize,
  User,
  MenuItem,
  Order,
  OrderItem,
  Ingredient,
  Recipe
};
