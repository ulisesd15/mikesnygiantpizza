const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("MenuItem", {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    price: { type: DataTypes.FLOAT, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false } // pizza, sub, burger, etc.
  });
};
