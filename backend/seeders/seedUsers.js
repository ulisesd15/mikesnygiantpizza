// backend/seeders/seedUsers.js
require('dotenv').config();

const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    await User.sync({ alter: true });

    const users = [
      {
        id: 2,
        email: 'admin@mikes.com',
        password: 'Admin123!', // ✅ Plain text - will be hashed by model hook
        role: 'admin',
        name: 'Admin User',
        authProvider: 'local' // ✅ Add this
      },
      {
        id: 3,
        email: 'ulises@mikes.com',
        password: 'Ed123!', // ✅ Plain text - will be hashed by model hook
        role: 'admin',
        name: 'Ulises',
        phone: '619-721-2947',
        address: '404 Sycamore Rd. Apt. 2',
        authProvider: 'local' // ✅ Add this
      },
      {
        id: 4,
        email: 'test@mikes.com',
        password: 'Test123!', // ✅ Plain text - will be hashed by model hook
        role: 'customer',
        name: 'Test Customer',
        phone: '555-0100',
        address: '123 Test Street',
        authProvider: 'local' // ✅ Add this
      }
    ];

    // Insert or update users
    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData // This will trigger beforeCreate hook
      });

      if (created) {
        console.log(`✅ Created user: ${userData.email} (password: ${userData.password})`);
      } else {
        // ✅ CRITICAL FIX: Update without triggering password re-hash
        await user.update({
          role: userData.role,
          name: userData.name,
          phone: userData.phone || user.phone,
          address: userData.address || user.address,
          authProvider: userData.authProvider
          // ⚠️ DON'T update password here to avoid double hashing
        }, {
          hooks: false // Skip hooks to prevent double hashing
        });
        console.log(`🔄 Updated existing user: ${userData.email}`);
      }
    }

    console.log('\n✅ User seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@mikes.com / Admin123!');
    console.log('   Ulises: ulises@mikes.com / Ed123!');
    console.log('   Test: test@mikes.com / Test123!\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding users failed:', err);
    process.exit(1);
  }
}

seedUsers();
