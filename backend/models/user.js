const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer'
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    phone: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },

    authProvider: {
      type: DataTypes.ENUM('local', 'google'),
      allowNull: false,
      defaultValue: 'local'
    },

    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.authProvider === 'local' && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.authProvider === 'local' && user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.validatePassword = async function (password) {
    if (this.authProvider !== 'local' || !this.password) return false;
    return bcrypt.compare(password, this.password);
  };

  User.prototype.isAdmin = function () {
    return this.role === 'admin';
  };

  User.associate = (models) => {
  User.hasMany(models.Order, {
    foreignKey: 'userId',
    as: 'orders'
  });
};

  return User;
};
