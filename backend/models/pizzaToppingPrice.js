// backend/models/pizzaToppingPrice.js
module.exports = (sequelize, DataTypes) => {
  const PizzaToppingPrice = sequelize.define(
    'pizzaToppingPrice',
    {
      ingredientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      size: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      tableName: 'pizza_topping_prices'
    }
  );

  PizzaToppingPrice.associate = (models) => {
    PizzaToppingPrice.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  return PizzaToppingPrice;
};
