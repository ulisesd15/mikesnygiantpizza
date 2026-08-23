module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'accepted',
          'preparing',
          'ready',
          'completed',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      orderType: {
        type: DataTypes.ENUM('pickup', 'delivery'),
        allowNull: false,
        defaultValue: 'pickup'
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'cash'
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: 'orders',
      timestamps: true
    }
  );

  Order.associate = (models) => {
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'orderItems'
    });
  };

  return Order;
};