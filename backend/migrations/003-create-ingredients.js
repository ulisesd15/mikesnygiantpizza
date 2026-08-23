// backend/migrations/create-ingredients.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currentStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reorderLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pieces'
      },
      unitCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('Ingredients');
  }
};