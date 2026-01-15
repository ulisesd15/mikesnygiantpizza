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
    allowNull: true, // ✅ CHANGED: Allow null for OAuth users
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
  address: DataTypes.TEXT,
  // ✅ NEW FIELDS for OAuth
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  authProvider: {
    type: DataTypes.ENUM('local', 'google'),
    defaultValue: 'local',
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      // ✅ UPDATED: Only hash password if it exists and user is not OAuth
      if (user.password && user.authProvider === 'local') {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // ✅ UPDATED: Only hash password if it changed and user is local auth
      if (user.changed('password') && user.password && user.authProvider === 'local') {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});


User.prototype.validatePassword = async function(password) {
  if (!this.password || this.authProvider !== 'local') {
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

module.exports = User;
