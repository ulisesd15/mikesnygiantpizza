const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { 
    type: DataTypes.ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled'), 
    defaultValue: 'pending' 
  },
  totalAmount: { type: DataTypes.DECIMAL(10, 2) },
  deliveryAddress: DataTypes.TEXT
});

module.exports = Order;
