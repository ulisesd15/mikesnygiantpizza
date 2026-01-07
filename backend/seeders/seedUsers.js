// backendgo/seeders/seedUsers.js
require('dotenv').config();

const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    await sequelize.authenticate();

    const saltRounds = 10;

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
    const ulisesPasswordHash = await bcrypt.hash('Ed123!', saltRounds);

    const users = [
      {
        email: 'admin@mikes.com',
        password: adminPasswordHash,
        role: 'admin',
        name: 'Admin',
      },
      {
        email: 'ulises@mikes.com',
        password: ulisesPasswordHash,
        role: 'admin', // or 'customer' if you prefer
        name: 'Ulises',
      },
    ];

    // Insert users; ignore if they already exist
    for (const user of users) {
      const [record, created] = await User.findOrCreate({
        where: { email: user.email },
        defaults: user,
      });

      console.log(
        created
          ? `✅ Created user ${user.email}`
          : `ℹ️ User ${user.email} already exists`
      );
    }

    console.log('✅ User seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding users failed:', err);
    process.exit(1);
  }
}

seedUsers();
