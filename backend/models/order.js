// backend/models/order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  
  // Order identification
  orderNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  
  // Guest customer info (for non-logged-in users)
  guestName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Order type and delivery info
  orderType: {
    type: DataTypes.ENUM('delivery', 'pickup'),
    allowNull: false,
    defaultValue: 'delivery'
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Payment info
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card'),
    allowNull: false,
    defaultValue: 'cash'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  // Order status
  status: { 
    type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'), 
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Price breakdown
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  // Estimated delivery/pickup time in minutes
  estimatedTime: {
    type: DataTypes.INTEGER,
    defaultValue: 35
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  hooks: {
    beforeCreate: async (order) => {
      // Generate unique order number
      if (!order.orderNumber) {
        order.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    }
  }
});


module.exports = Order;
