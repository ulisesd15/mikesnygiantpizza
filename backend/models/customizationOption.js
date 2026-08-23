// backend/models/customizationOption.js
module.exports = (sequelize, DataTypes) => {
  const CustomizationOption = sequelize.define(
    'CustomizationOption',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'CustomizationGroups',
          key: 'id'
        }
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      priceDelta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'CustomizationOptions',
      timestamps: true,
      indexes: [
        { fields: ['groupId'] },
        { fields: ['displayOrder'] },
        { unique: true, fields: ['groupId', 'key'] }
      ]
    }
  );

  CustomizationOption.associate = (models) => {
    CustomizationOption.belongsTo(models.CustomizationGroup, {
      foreignKey: 'groupId',
      as: 'group'
    });

    CustomizationOption.hasMany(models.OrderItemCustomization, {
      foreignKey: 'optionId',
      as: 'orderItemCustomizations'
    });
  };

  return CustomizationOption;
};