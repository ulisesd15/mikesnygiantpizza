'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('menu_item_default_toppings', 'isDefault', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.addColumn('menu_item_default_toppings', 'isOptional', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.addColumn('menu_item_default_toppings', 'canRemove', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.addColumn('menu_item_default_toppings', 'canAddExtra', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('menu_item_default_toppings', 'displayOrder', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    
    await queryInterface.addIndex('menu_item_default_toppings', 
      ['menuItemId', 'ingredientId'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('menu_item_default_toppings', 'isDefault');
    await queryInterface.removeColumn('menu_item_default_toppings', 'isOptional');
    await queryInterface.removeColumn('menu_item_default_toppings', 'canRemove');
    await queryInterface.removeColumn('menu_item_default_toppings', 'canAddExtra');
    await queryInterface.removeColumn('menu_item_default_toppings', 'displayOrder');
    await queryInterface.removeIndex('menu_item_default_toppings', ['menuItemId', 'ingredientId']);
  }
};

// npx sequelize-cli db:migrate