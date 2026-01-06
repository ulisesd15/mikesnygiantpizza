const { sequelize, MenuItem } = require('./models');

const items = [
  {
    name: 'Giant Cheese',
    description: 'Classic NY style cheese pizza with our signature sauce.',
    price: 18.00,
    size: '16"',
    category: 'pizza',
    isAvailable: true
  },
  {
    name: 'Pepperoni Feast',
    description: 'Loaded with double pepperoni and extra mozzarella.',
    price: 22.00,
    size: '16"',
    category: 'pizza',
    isAvailable: true
  },
  {
    name: 'The Giant 28"',
    description: 'Our famous 28-inch party pizza! Feeds the whole block.',
    price: 45.00,
    size: '28"',
    category: 'pizza',
    isAvailable: true
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine, croutons, parmesan, and caesar dressing.',
    price: 9.00,
    category: 'salad',
    isAvailable: true
  },
  {
    name: 'Buffalo Wings',
    description: '10pc spicy buffalo wings with ranch.',
    price: 14.00,
    category: 'wings',
    isAvailable: true
  }
];

async function seed() {
  try {
    console.log('🌱 Connecting to database...');
    await sequelize.sync(); 
    
    const count = await MenuItem.count();
    if (count > 0) {
      console.log('⚠️ Menu already has items. Skipping seed.');
    } else {
      await MenuItem.bulkCreate(items);
      console.log('✅ Menu seeded successfully!');
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await sequelize.close();
  }
}

seed();