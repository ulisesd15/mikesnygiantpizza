//backend/seeders/seedUsers.js
'use strict';

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const admins = [
  {
    email: 'admin@mikes.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Admin User',
    phone: null
  },
  {
    email: 'ulises@mikes.com',
    password: 'Ed123!',
    role: 'admin',
    name: 'Ulises',
    phone: '619-721-2947'
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const hashedAdmins = await Promise.all(
      admins.map(async (admin) => ({
        ...admin,
        password: await bcrypt.hash(admin.password, 10),
        createdAt: now,
        updatedAt: now
      }))
    );

    await queryInterface.bulkInsert('Admins', hashedAdmins, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'Admins',
      {
        email: {
          [Op.in]: ['admin@mikes.com', 'ulises@mikes.com']
        }
      },
      {}
    );
  }
};