// backend/models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  
  // User ID (optional - for logged-in users)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Order identification
  orderNumber: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false
  },
  
  // ✅ CHANGED: Use customerName instead of guestName (works for both guests and logged-in users)
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false
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

// ✅ ASSOCIATIONS
Order.associate = (models) => {
  // Order belongs to User (optional - can be null for guest orders)
  Order.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'User'
  });

  // Order has many OrderItems
  Order.hasMany(models.OrderItem, {
    foreignKey: 'orderId',
    as: 'OrderItems',
    onDelete: 'CASCADE'
  });
};

module.exports = Order;
