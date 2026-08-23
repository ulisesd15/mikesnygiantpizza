// backend/migrations/create-customization-options.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CustomizationOptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CustomizationGroups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      priceDelta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Unique + indexes from your model
    await queryInterface.addConstraint('CustomizationOptions', {
      fields: ['groupId', 'key'],
      type: 'unique',
      name: 'customization_options_groupId_key_unique'
    });
    await queryInterface.addIndex('CustomizationOptions', ['groupId'], {
      name: 'customization_options_groupId_idx'
    });
    await queryInterface.addIndex('CustomizationOptions', ['displayOrder'], {
      name: 'customization_options_displayOrder_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CustomizationOptions');
  }
};