// backend/models/user.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin'),
    defaultValue: 'customer',
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: DataTypes.STRING,
  address: DataTypes.TEXT
}, {
  timestamps: true,
  hooks: {
    // Automatically hash password before creating new user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Automatically hash password before updating if it changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to validate password during login
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to check if user is admin
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

module.exports = User;
