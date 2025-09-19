const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("OrderItem", {
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 }
  });
};
