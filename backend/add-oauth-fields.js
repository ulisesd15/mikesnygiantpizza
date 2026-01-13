//add-oauth-fields.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'googleId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'authProvider', {
      type: Sequelize.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false
    });
    await queryInterface.addColumn('Users', 'profilePicture', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'authProvider');
    await queryInterface.removeColumn('Users', 'profilePicture');
  }
};
