// backendgo/seeders/seedUsers.js
require('dotenv').config();

const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');
const { patch } = require('../routes/auth');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    await User.sync({ alter: true });

    const saltRounds = 10;

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
    const ulisesPasswordHash = await bcrypt.hash('Ed123!', saltRounds);

    const users = [
      {
        id: 2,
        email: 'admin@mikes.com',
        password: adminPasswordHash,
        role: 'admin',
        name: 'Admin'
      },
      {
        id: 3,
        email: 'ulises@mikes.com',
        password: ulisesPasswordHash,
        role: 'admin', // or 'customer' if you prefer
        name: 'Ulises',
        phone: '619-721-2947',
        address: '404 Sycamore Rd. Apt. 2'
      },
    ];

    // Insert users; ignore if they already exist
    for (const user of users) {
      const [record, created] = await User.findOrCreate({
        where: { email: user.email },
        defaults: user,
      });

      if (created) {
        console.log(`✅ Created user ${user.email}`);
      } else {
        record.password = user.password;
        record.role = user.role;
        record.name = user.name;
        await record.save();
        console.log(`🔄 Updated existing user ${user.email}`);
      }
    }

    console.log('✅ User seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding users failed:', err);
    process.exit(1);
  }
}

seedUsers();
