const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    
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
    tableName: 'OrderItems',  // ✅ Explicit
    timestamps: false
  });

  // Your associations PERFECT ✅
  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'Order'
    });

    OrderItem.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'MenuItem'
    });
  };

  return OrderItem;
};
