// backend/migrations/create-order-items.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItems', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      menuItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MenuItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      specialInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      addedToppings: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]'
      },
      removedToppings: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]'
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
    await queryInterface.addIndex('OrderItems', ['orderId'], {
      name: 'order_items_orderId_idx'
    });
    await queryInterface.addIndex('OrderItems', ['menuItemId'], {
      name: 'order_items_menuItemId_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OrderItems');
  }
};