const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
      'pizza',           
      'salad',           
      'calzone',         
      'pasta',           
      'hamburger',       
      'sub',             
      'wings',           
      'nuggets',         
      'calamari',        
      'appetizer',       // ← ADDED: Mozzarella sticks, etc.
      'combo',
      'drink',
      'dessert',
      'side'
    ),
    allowNull: false
  },
  imageUrl: DataTypes.STRING,
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = MenuItem;
