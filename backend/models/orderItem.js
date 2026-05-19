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
  }, {
    tableName: 'orderItems',
    timestamps: false
  });

  OrderItem.associate = (models) => {
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