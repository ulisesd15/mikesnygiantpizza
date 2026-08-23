// backend/migrations/create-menu-item-allowed-ingredients.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MenuItemAllowedIngredients', {
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
      maxQuantity: {
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
    await queryInterface.addIndex('MenuItemAllowedIngredients', ['menuItemId'], {
      name: 'menu_item_allowed_ingredients_menuItemId_idx'
    });
    await queryInterface.addIndex('MenuItemAllowedIngredients', ['ingredientId'], {
      name: 'menu_item_allowed_ingredients_ingredientId_idx'
    });
    await queryInterface.addIndex('MenuItemAllowedIngredients', ['displayOrder'], {
      name: 'menu_item_allowed_ingredients_displayOrder_idx'
    });
    await queryInterface.addConstraint('MenuItemAllowedIngredients', {
      fields: ['menuItemId', 'ingredientId'],
      type: 'unique',
      name: 'menu_item_allowed_ingredients_menuItemId_ingredientId_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MenuItemAllowedIngredients');
  }
}