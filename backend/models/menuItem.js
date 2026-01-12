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
      'appetizer',       
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

// ✅ ASSOCIATIONS - CRITICAL for OrderItem eager loading
MenuItem.associate = (models) => {
  // MenuItem has many OrderItems (when items are ordered)
  MenuItem.hasMany(models.OrderItem, {
    foreignKey: 'menuItemId',
    as: 'OrderItems',
    onDelete: 'NO ACTION'
  });
};

module.exports = MenuItem;
