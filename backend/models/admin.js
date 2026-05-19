// backend/models/admin.js
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
        allowNull: false,
        defaultValue: 'admin'
      }
    },
    {
      tableName: 'Admins',
      timestamps: true,
      hooks: {
        beforeSave: async (admin) => {
          if (!admin.changed('password')) return;
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
      defaultScope: {
        attributes: {
          exclude: ['password']
        }
      },
      scopes: {
        withPassword: {
          attributes: {}
        }
      }
    }
  );

  Admin.prototype.validatePassword = async function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  };

  Admin.associate = () => {
    // Keep empty unless Admin gets real relations later
  };

  return Admin;
};