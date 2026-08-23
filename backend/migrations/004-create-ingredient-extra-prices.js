// backend/migrations/create-ingredient-extra-prices.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IngredientExtraPrices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      size: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
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

    // Unique + index from your model
    await queryInterface.addConstraint('IngredientExtraPrices', {
      fields: ['ingredientId', 'size'],
      type: 'unique',
      name: 'ingredient_extra_prices_ingredientId_size_unique'
    });
    await queryInterface.addIndex('IngredientExtraPrices', ['ingredientId'], {
      name: 'ingredient_extra_prices_ingredientId_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('IngredientExtraPrices');
  }
};