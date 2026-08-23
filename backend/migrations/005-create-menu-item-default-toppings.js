// backend/migrations/create-menu-item-default-toppings.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MenuItemDefaultToppings', {
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
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      canRemove: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      canAddExtra: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Indexes from your model
    await queryInterface.addIndex('MenuItemDefaultToppings', ['menuItemId'], {
      name: 'menu_item_default_toppings_menuItemId_idx'
    });
    await queryInterface.addIndex('MenuItemDefaultToppings', ['ingredientId'], {
      name: 'menu_item_default_toppings_ingredientId_idx'
    });
    await queryInterface.addIndex('MenuItemDefaultToppings', ['displayOrder'], {
      name: 'menu_item_default_toppings_displayOrder_idx'
    });
    await queryInterface.addConstraint('MenuItemDefaultToppings', {
      fields: ['menuItemId', 'ingredientId'],
      type: 'unique',
      name: 'menu_item_default_toppings_menuItemId_ingredientId_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MenuItemDefaultToppings');
  }
};