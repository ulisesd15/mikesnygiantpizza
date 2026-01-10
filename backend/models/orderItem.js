// backend/models/OrderItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  
  // Foreign keys
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'MenuItems',
      key: 'id'
    }
  },
  
  // Snapshot fields (preserve item details at order time)
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  // Order details
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false // No need for timestamps on order items
});

// ✅ ASSOCIATIONS
OrderItem.associate = (models) => {
  // OrderItem belongs to Order
  OrderItem.belongsTo(models.Order, {
    foreignKey: 'orderId',
    as: 'Order'
  });

  // OrderItem belongs to MenuItem
  OrderItem.belongsTo(models.MenuItem, {
    foreignKey: 'menuItemId',
    as: 'MenuItem'
  });
};

module.exports = OrderItem;
