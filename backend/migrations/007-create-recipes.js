// backend/migrations/create-recipes.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Recipes', {
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
      ingredientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Ingredients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantityRequired: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 1.000
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

    // Unique index on (menuItemId, ingredientId)
    await queryInterface.addConstraint('Recipes', {
      fields: ['menuItemId', 'ingredientId'],
      type: 'unique',
      name: 'recipes_menuItemId_ingredientId_unique'
    });

    // Indexes for performance
    await queryInterface.addIndex('Recipes', ['menuItemId'], {
      name: 'recipes_menuItemId_idx'
    });
    await queryInterface.addIndex('Recipes', ['ingredientId'], {
      name: 'recipes_ingredientId_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Recipes');
  }
};