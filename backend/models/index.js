const sequelize = require('../config/database');

const User = require('./User');
const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Ingredient = require('./ingredient');
const Recipe = require('./recipe');

// ✅ STEP 1: Export FIRST
const models = {
  sequelize,
  User,
  MenuItem,
  Order,
  OrderItem,
  Ingredient,
  Recipe
};
module.exports = models;

// ✅ STEP 2: NOW call associations (models is complete)
User.associate?.(models);
MenuItem.associate?.(models);
Order.associate?.(models);
OrderItem.associate?.(models);
Ingredient.associate?.(models);
Recipe.associate?.(models);

// ✅ STEP 3: Debug
console.log('🔍 === MODELS LOADED ===');
console.log('🔍 Order associations:', Object.keys(Order.associations || []));
console.log('🔍 OrderItems?', !!Order.associations?.OrderItems ? '✅ YES' : '❌ NO');
