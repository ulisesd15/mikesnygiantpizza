// backend/models/customizationGroup.js
module.exports = (sequelize, DataTypes) => {
  const CustomizationGroup = sequelize.define(
    'CustomizationGroup',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'MenuItems', key: 'id' }
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      inputType: {
        type: DataTypes.ENUM('checkbox', 'radio', 'select', 'textArea', 'quantity'),
        allowNull: false,
        defaultValue: 'checkbox'
      },
      selectionMode: {
        type: DataTypes.ENUM('single', 'multiple', 'textArea', 'quantity'),
        allowNull: false,
        defaultValue: 'multiple'
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      minSelect: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      maxSelect: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'CustomizationGroups',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['menuItemId', 'key']
        },
        {
          fields: ['menuItemId']
        },
        {
          fields: ['displayOrder']
        }
      ]
    }
  );

  CustomizationGroup.associate = (models) => {
    CustomizationGroup.belongsTo(models.MenuItem, {
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });

    CustomizationGroup.hasMany(models.CustomizationOption, {
      foreignKey: 'groupId',
      as: 'options'
    });
  };

  return CustomizationGroup;
};