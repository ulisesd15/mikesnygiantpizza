module.exports = (sequelize, DataTypes) => {
  const OrderItemCustomization = sequelize.define(
    'OrderItemCustomization',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'OrderItems',
          key: 'id'
        }
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomizationGroups',
          key: 'id'
        }
      },
      optionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomizationOptions',
          key: 'id'
        }
      },
      groupKey: {
        type: DataTypes.STRING,
        allowNull: true
      },
      optionKey: {
        type: DataTypes.STRING,
        allowNull: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      valueText: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      priceDelta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      }
    },
    {
      tableName: 'OrderItemCustomizations',
      timestamps: false,
      indexes: [
        { fields: ['orderItemId'] },
        { fields: ['groupId'] },
        { fields: ['optionId'] }
      ]
    }
  );

  OrderItemCustomization.associate = (models) => {
    OrderItemCustomization.belongsTo(models.OrderItem, {
      foreignKey: 'orderItemId',
      as: 'orderItem'
    });

    OrderItemCustomization.belongsTo(models.CustomizationGroup, {
      foreignKey: 'groupId',
      as: 'group'
    });

    OrderItemCustomization.belongsTo(models.CustomizationOption, {
      foreignKey: 'optionId',
      as: 'option'
    });
  };

  return OrderItemCustomization;
};