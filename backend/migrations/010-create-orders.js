// backend/migrations/create-orders.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM('pickup', 'delivery'),
        allowNull: false,
        defaultValue: 'pickup'
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      deliveryFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'cash'
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: false
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  }
};