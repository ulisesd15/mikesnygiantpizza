const { Sequelize } = require("sequelize");
const config = require("../config/config").development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false,
  }
);

// Import models
const User = require("./User")(sequelize);
const MenuItem = require("./MenuItem")(sequelize);
const Order = require("./Order")(sequelize);
const OrderItem = require("./OrderItem")(sequelize);

// Associations
User.hasMany(Order);
Order.belongsTo(User);

Order.belongsToMany(MenuItem, { through: OrderItem });
MenuItem.belongsToMany(Order, { through: OrderItem });

module.exports = { sequelize, User, MenuItem, Order, OrderItem };
