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
    type: DataTypes.ENUM('14"', '16"', '20"', '28"'),
    allowNull: false,
    defaultValue: '16"'
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
      'appetizer'        // ← ADDED: Mozzarella sticks, etc.
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
