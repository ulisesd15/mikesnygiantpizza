// backend/models/admin.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {  // ✅ Factory function
  const Admin = sequelize.define('Admin', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'admin',
      allowNull: false
    }
  }, {
    tableName: 'Admins',  // ✅ Explicit table name
    timestamps: true,
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed('password') && admin.password) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      }
    }
  });

  
  Admin.prototype.validatePassword = async function(password) {
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(password, this.password);
  };

  // Admin.associate = (models) => {
  //   // Add Admin associations here if needed later
  // };

  return Admin;
};




