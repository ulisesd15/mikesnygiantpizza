// backend/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {  // ✅ Factory function
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
      allowNull: true,
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
    tableName: 'Users',  // ✅ Add explicit tableName
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && user.authProvider === 'local') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password && user.authProvider === 'local') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // ✅ Move prototype methods inside factory
  User.prototype.validatePassword = async function(password) {
    if (!this.password || this.authProvider !== 'local') {
      return false;
    }
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  User.associate = (models) => {
    // Add User associations here later if needed
    // User.hasMany(models.Order, { foreignKey: 'userId' });
  };

  return User;
};
