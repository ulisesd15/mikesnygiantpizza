//backend/models/orderItem.js
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        }
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
      unitPrice: {
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
      },
      addedToppings: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
          const rawValue = this.getDataValue('addedToppings');
          try {
            return rawValue ? JSON.parse(rawValue) : [];
          } catch (error) {
            return [];
          }
        },
        set(value) {
          this.setDataValue('addedToppings', JSON.stringify(value || []));
        }
      },
      removedToppings: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
          const rawValue = this.getDataValue('removedToppings');
          try {
            return rawValue ? JSON.parse(rawValue) : [];
          } catch (error) {
            return [];
          }
        },
        set(value) {
          this.setDataValue('removedToppings', JSON.stringify(value || []));
        }
      }
    },
    {
      tableName: 'OrderItems',
      timestamps: false,
      indexes: [
        { fields: ['orderId'] },
        { fields: ['menuItemId'] }
      ]
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.hasMany(models.OrderItemCustomization, {
      foreignKey: 'orderItemId',
      as: 'customizations'
    });

    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    OrderItem.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });
  };

  return OrderItem;
};