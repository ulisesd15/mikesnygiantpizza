// backend/models/pizzaToppingPrice.js
module.exports = (sequelize, DataTypes) => {
  const PizzaToppingPrice = sequelize.define(
    'PizzaToppingPrice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ingredientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Ingredients',
          key: 'id'
        }
      },
      size: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      tableName: 'pizza_topping_prices',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['ingredientId', 'size']
        }
      ]
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