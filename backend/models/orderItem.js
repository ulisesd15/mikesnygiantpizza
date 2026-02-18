

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
      allowNull: false
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'orderItems',
    timestamps: false
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.order, {      // 'order' from Loaded models
      foreignKey: 'orderId',
      as: 'order'
    });

    OrderItem.belongsTo(models.MenuItem, {   // 'MenuItem' from Loaded models
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });
  };




  return OrderItem;
};
