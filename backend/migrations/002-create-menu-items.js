// backend/migrations/create-menu-items.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MenuItems', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
          'pizza',
          'salad',
          'calzone',
          'pasta',
          'hamburger',
          'sub',
          'wings',
          'nuggets',
          'calamari',
          'appetizer',
          'combo',
          'drink',
          'dessert',
          'side'
        ),
        allowNull: false
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isAvailable: {
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

    // Indexes from your model
    await queryInterface.addIndex('MenuItems', ['category'], {
      name: 'menu_items_category_idx'
    });
    await queryInterface.addIndex('MenuItems', ['isAvailable'], {
      name: 'menu_items_isAvailable_idx'
    });
    await queryInterface.addIndex('MenuItems', ['name'], {
      name: 'menu_items_name_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MenuItems');
  }
};