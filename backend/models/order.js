const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled'),
      allowNull: true,
      defaultValue: 'pending'
    },
    totalPrice: {  // Matches your table
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customerPhone: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'orders',
    timestamps: true,  // createdAt/updatedAt (matches table)
    underscored: true  // created_at/updated_at if needed
  });

  Order.associate = (models) => {
    // User (optional for guest orders)
    if (models.User && !Order.associations.user) {
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
    // OrderItems
    if (models.OrderItem && !Order.associations.orderItems) {
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'orderItems'
      });
    }
  };

  return Order;
};
