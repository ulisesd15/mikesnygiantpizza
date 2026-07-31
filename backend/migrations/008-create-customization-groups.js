// backend/migrations/create-customization-groups.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CustomizationGroups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      menuItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MenuItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      inputType: {
        type: Sequelize.ENUM(
          'checkbox',
          'radio',
          'select',
          'textArea',
          'quantity'
        ),
        allowNull: false,
        defaultValue: 'checkbox'
      },
      selectionMode: {
        type: Sequelize.ENUM(
          'single',
          'multiple',
          'textArea',
          'quantity'
        ),
        allowNull: false,
        defaultValue: 'multiple'
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      minSelect: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maxSelect: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addConstraint('CustomizationGroups', {
      fields: ['menuItemId', 'key'],
      type: 'unique',
      name: 'customization_groups_menuItemId_key_unique'
    });
    await queryInterface.addIndex('CustomizationGroups', ['menuItemId'], {
      name: 'customization_groups_menuItemId_idx'
    });
    await queryInterface.addIndex('CustomizationGroups', ['displayOrder'], {
      name: 'customization_groups_displayOrder_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CustomizationGroups');
  }
};