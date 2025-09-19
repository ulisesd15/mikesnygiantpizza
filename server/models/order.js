const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Order", {
    status: { type: DataTypes.STRING, defaultValue: "pending" },
    total: { type: DataTypes.FLOAT, defaultValue: 0 }
  });
};
