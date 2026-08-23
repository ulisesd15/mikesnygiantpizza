// backend/migrations/create-order-item-customization.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItemCustomizations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OrderItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomizationGroups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      optionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomizationOptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      groupKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      optionKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      valueText: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priceDelta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
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

    // Indexes from your model
    await queryInterface.addIndex('OrderItemCustomizations', ['orderItemId'], {
      name: 'order_item_customizations_orderItemId_idx'
    });
    await queryInterface.addIndex('OrderItemCustomizations', ['groupId'], {
      name: 'order_item_customizations_groupId_idx'
    });
    await queryInterface.addIndex('OrderItemCustomizations', ['optionId'], {
      name: 'order_item_customizations_optionId_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OrderItemCustomizations');
  }
};