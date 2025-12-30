const { MenuItem } = require('../models');

const realMenuItems = [
  // 🔥 PIZZAS - 4 SIZES EACH
  { name: 'Cheese Pizza', description: 'Classic cheese pizza with house-made sauce', price: 17.99, size: '14"', category: 'pizza' },
  { name: 'Cheese Pizza', description: 'Classic cheese pizza with house-made sauce', price: 22.99, size: '16"', category: 'pizza' },
  { name: 'Cheese Pizza', description: 'Classic cheese pizza with house-made sauce', price: 26.99, size: '20"', category: 'pizza' },
  { name: 'Cheese Pizza', description: 'Classic cheese pizza with house-made sauce', price: 39.99, size: '28"', category: 'pizza' },

  { name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, salami, beef, ham', price: 17.99, size: '14"', category: 'pizza' },
  { name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, salami, beef, ham', price: 22.99, size: '16"', category: 'pizza' },
  { name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, salami, beef, ham', price: 26.99, size: '20"', category: 'pizza' },
  { name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, salami, beef, ham', price: 39.99, size: '28"', category: 'pizza' },

  { name: 'Works Pizza', description: 'Everything! Pepperoni, sausage, ham, veggies', price: 17.99, size: '14"', category: 'pizza' },
  { name: 'Works Pizza', description: 'Everything! Pepperoni, sausage, ham, veggies', price: 22.99, size: '16"', category: 'pizza' },
  { name: 'Works Pizza', description: 'Everything! Pepperoni, sausage, ham, veggies', price: 26.99, size: '20"', category: 'pizza' },
  { name: 'Works Pizza', description: 'Everything! Pepperoni, sausage, ham, veggies', price: 39.99, size: '28"', category: 'pizza' },

  { name: 'Mexican Pizza', description: 'Beans, chorizo, onion, bacon, jalapeño', price: 17.99, size: '14"', category: 'pizza' },
  { name: 'Mexican Pizza', description: 'Beans, chorizo, onion, bacon, jalapeño', price: 22.99, size: '16"', category: 'pizza' },
  { name: 'Mexican Pizza', description: 'Beans, chorizo, onion, bacon, jalapeño', price: 26.99, size: '20"', category: 'pizza' },
  { name: 'Mexican Pizza', description: 'Beans, chorizo, onion, bacon, jalapeño', price: 39.99, size: '28"', category: 'pizza' },

  { name: 'Veggie Pizza', description: 'Bell peppers, olives, mushrooms, onions, tomatoes', price: 17.99, size: '14"', category: 'pizza' },
  { name: 'Veggie Pizza', description: 'Bell peppers, olives, mushrooms, onions, tomatoes', price: 22.99, size: '16"', category: 'pizza' },
  { name: 'Veggie Pizza', description: 'Bell peppers, olives, mushrooms, onions, tomatoes', price: 26.99, size: '20"', category: 'pizza' },
  { name: 'Veggie Pizza', description: 'Bell peppers, olives, mushrooms, onions, tomatoes', price: 39.99, size: '28"', category: 'pizza' },

  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushrooms, feta', price: 19.99, size: '14"', category: 'pizza' },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushrooms, feta', price: 24.99, size: '16"', category: 'pizza' },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushrooms, feta', price: 29.99, size: '20"', category: 'pizza' },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushrooms, feta', price: 42.99, size: '28"', category: 'pizza' },

  // 🌯 CALZONES (No sizes)
  { name: 'Cheese Calzone', description: 'Mozzarella cheese, ricotta, house sauce', price: 15.99, size: '16"', category: 'calzone' },

  // 🍗 WINGS
  { name: 'Buffalo Wings (12pc)', description: 'Crispy wings with house buffalo sauce', price: 16.99, size: '16"', category: 'wings' },

  // 🥗 SALADS
  { name: 'Greek Salad', description: 'Feta, olives, tomatoes, cucumbers, onions', price: 16.99, size: '16"', category: 'salad' },
  { name: 'Antipasto Salad', description: 'Ham, salami, pepperoni, provolone, veggies', price: 20.99, size: '16"', category: 'salad' },

  // 🥪 SUBS
  { name: 'Philly Cheese Steak Sub Combo', description: 'Steak, mushrooms, peppers, onions + fries & salad', price: 15.99, size: '16"', category: 'sub' },
  { name: 'Italian Sub Combo', description: 'Ham, pepperoni, salami, mozzarella + fries & salad', price: 15.99, size: '16"', category: 'sub' },
  { name: 'Buffalo Chicken Sub Combo', description: 'Chicken, buffalo sauce, onions + fries & salad', price: 15.99, size: '16"', category: 'sub' },

  // 🍔 BURGERS
  { name: 'House Cheese Burger Combo', description: '1/2 lb Angus beef, American cheese + fries & salad', price: 15.99, size: '16"', category: 'hamburger' },

  // 🍟 APPETIZERS
  { name: 'Mozzarella Sticks (6pc)', description: 'Crispy sticks with marinara', price: 7.99, size: '16"', category: 'appetizer' },
  { name: 'Jalapeno Poppers (6pc)', description: 'Cream cheese filled, breaded', price: 7.99, size: '16"', category: 'appetizer' },
  { name: 'Garlic Bread', description: 'Fresh baked with garlic butter', price: 7.99, size: '16"', category: 'appetizer' },
  { name: 'Onion Rings', description: 'Crispy beer-battered rings', price: 7.99, size: '16"', category: 'appetizer' }
];

const seedRealMenu = async () => {
  try {
    await MenuItem.destroy({ where: {} });
    await MenuItem.bulkCreate(realMenuItems);
    console.log(`✅ Seeded ${realMenuItems.length} Mike's NY Giant Pizza items!`);
    console.log('🍕 14" PIZZAS:', realMenuItems.filter(i => i.size === '14"').length);
    console.log('🍕 16" PIZZAS:', realMenuItems.filter(i => i.size === '16"').length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedRealMenu();
