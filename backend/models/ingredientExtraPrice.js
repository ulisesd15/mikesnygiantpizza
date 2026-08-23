//backend/models/ingredientExtraPrice.js
module.exports = (sequelize, DataTypes) => {
  const IngredientExtraPrice = sequelize.define(
    'IngredientExtraPrice',
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
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      tableName: 'IngredientExtraPrices',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['ingredientId', 'size'] },
        { fields: ['ingredientId'] }
      ]
    }
  );

  IngredientExtraPrice.associate = (models) => {
    IngredientExtraPrice.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  return IngredientExtraPrice;
};