

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
    // Guard: Skip if model miss
    // ing or assoc duplicate
    if (models.Order && !OrderItem.associations.order) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
    if (models.MenuItem && !OrderItem.associations.menuItem) {
      OrderItem.belongsTo(models.MenuItem, {
        foreignKey: 'menuItemId',
        as: 'menuItem'
      });
    }
  };

  return OrderItem;
};
