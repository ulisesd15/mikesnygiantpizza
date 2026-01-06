require('dotenv').config();
const { sequelize, MenuItem } = require('../models');

const items = [
  // ========== SPECIALTY PIZZAS (All 4 Sizes) ==========
  
  // Greek Pizza
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushroom, and fetta cheese', price: 12.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushroom, and fetta cheese', price: 16.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushroom, and fetta cheese', price: 22.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'Greek Pizza', description: 'Pepperoni, black olives, onion, mushroom, and fetta cheese', price: 35.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // The Works Pizza
  { name: 'The Works', description: 'Pepperoni, sausage, ham, bell pepper, mushroom, onion, black olives, jalapeño, and pineapple', price: 15.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'The Works', description: 'Pepperoni, sausage, ham, bell pepper, mushroom, onion, black olives, jalapeño, and pineapple', price: 19.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'The Works', description: 'Pepperoni, sausage, ham, bell pepper, mushroom, onion, black olives, jalapeño, and pineapple', price: 25.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'The Works', description: 'Pepperoni, sausage, ham, bell pepper, mushroom, onion, black olives, jalapeño, and pineapple', price: 39.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // Veggie Pizza
  { name: 'Veggie Pizza', description: 'Bell pepper, black olives, mushrooms, onions, sliced tomato, jalapeño, and pineapple', price: 13.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'Veggie Pizza', description: 'Bell pepper, black olives, mushrooms, onions, sliced tomato, jalapeño, and pineapple', price: 17.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'Veggie Pizza', description: 'Bell pepper, black olives, mushrooms, onions, sliced tomato, jalapeño, and pineapple', price: 23.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'Veggie Pizza', description: 'Bell pepper, black olives, mushrooms, onions, sliced tomato, jalapeño, and pineapple', price: 36.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // Meat Lovers Pizza
  { name: 'Meat Lovers', description: 'Pepperoni, sausage, salami, beef, and ham', price: 14.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'Meat Lovers', description: 'Pepperoni, sausage, salami, beef, and ham', price: 18.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'Meat Lovers', description: 'Pepperoni, sausage, salami, beef, and ham', price: 24.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'Meat Lovers', description: 'Pepperoni, sausage, salami, beef, and ham', price: 38.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // Mexican Pizza
  { name: 'Mexican Pizza', description: 'Refried beans, chorizo, onion, bacon, and jalapeño', price: 14.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'Mexican Pizza', description: 'Refried beans, chorizo, onion, bacon, and jalapeño', price: 18.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'Mexican Pizza', description: 'Refried beans, chorizo, onion, bacon, and jalapeño', price: 24.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'Mexican Pizza', description: 'Refried beans, chorizo, onion, bacon, and jalapeño', price: 38.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // Build Your Own Pizza (Base prices - cheese only)
  { name: 'Build Your Own Pizza', description: 'Start with cheese and add your favorite toppings', price: 10.99, size: '14"', category: 'pizza', isAvailable: true },
  { name: 'Build Your Own Pizza', description: 'Start with cheese and add your favorite toppings', price: 14.99, size: '16"', category: 'pizza', isAvailable: true },
  { name: 'Build Your Own Pizza', description: 'Start with cheese and add your favorite toppings', price: 19.99, size: '20"', category: 'pizza', isAvailable: true },
  { name: 'Build Your Own Pizza', description: 'Start with cheese and add your favorite toppings', price: 32.99, size: '28"', category: 'pizza', isAvailable: true },
  
  // ========== CHICKEN WINGS ==========
  { name: 'Chicken Wings', description: '10pc crispy chicken wings with your choice of sauce', price: 10.99, size: '10pc', category: 'wings', isAvailable: true },
  { name: 'Chicken Wings', description: '15pc crispy chicken wings with your choice of sauce', price: 15.99, size: '15pc', category: 'wings', isAvailable: true },
  { name: 'Chicken Wings', description: '20pc crispy chicken wings with your choice of sauce', price: 19.99, size: '20pc', category: 'wings', isAvailable: true },
  
  // ========== SALADS ==========
  { name: 'Antipasto Salad', description: 'Romaine, tomato, cucumber, black olives, onion, salami, ham, pepperoni, mozzarella, pepperoncini, house dressing', price: 11.99, category: 'salad', isAvailable: true },
  { name: 'Greek Salad', description: 'Romaine, tomato, cucumber, black olives, onion, fetta, pepperoncini, house dressing', price: 9.99, category: 'salad', isAvailable: true },
  { name: 'Grilled Chicken Salad', description: 'Grilled chicken, romaine, tomato, cucumber, black olives, onion, fetta, pepperoncini, house dressing', price: 12.99, category: 'salad', isAvailable: true },
  
  // ========== APPETIZERS ==========
  { name: 'French Fries', description: 'Crispy golden fries', price: 4.99, category: 'appetizer', isAvailable: true },
  { name: 'Mozzarella Sticks', description: '6pc breaded mozzarella with marinara sauce', price: 7.99, size: '6pc', category: 'appetizer', isAvailable: true },
  { name: 'Jalapeño Poppers', description: '6pc cream cheese stuffed jalapeños', price: 7.99, size: '6pc', category: 'appetizer', isAvailable: true },
  { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 4.99, category: 'appetizer', isAvailable: true },
  { name: 'Onion Rings', description: 'Crispy breaded onion rings', price: 5.99, category: 'appetizer', isAvailable: true },
  { name: 'Zucchini', description: 'Breaded and fried zucchini sticks', price: 6.99, category: 'appetizer', isAvailable: true },
  
  // ========== PASTA ==========
  { name: 'House Lasagna', description: 'Layers of pasta, meat sauce, and cheese', price: 13.99, category: 'pasta', isAvailable: true },
  { name: 'Beef Ravioli', description: 'Beef-filled ravioli with marinara sauce', price: 12.99, category: 'pasta', isAvailable: true },
  { name: 'Cheese Manicotti', description: 'Pasta tubes stuffed with ricotta cheese', price: 12.99, category: 'pasta', isAvailable: true },
  { name: 'Spaghetti w/ Meatballs & Mushrooms', description: 'Classic spaghetti with meatballs and mushrooms', price: 13.99, category: 'pasta', isAvailable: true },
  
  // ========== 10" SUB COMBOS ==========
  { name: 'Italian Sub Combo', description: 'Ham, salami, pepperoni, lettuce, tomato, onion. Includes fries and salad', price: 12.99, size: '10"', category: 'sub', isAvailable: true },
  { name: 'Philly Cheese Steak Combo', description: 'Steak, bell pepper, onion, mushroom, mozzarella. Includes fries and salad', price: 13.99, size: '10"', category: 'sub', isAvailable: true },
  { name: 'Chicken Philly Combo', description: 'Chicken, bell pepper, onion, mushroom, mozzarella. Includes fries and salad', price: 13.99, size: '10"', category: 'sub', isAvailable: true },
  { name: 'Meatball Sub Combo', description: 'Meatballs, marinara, mozzarella. Includes fries and salad', price: 12.99, size: '10"', category: 'sub', isAvailable: true },
  { name: 'Buffalo Chicken Sub Combo', description: 'Spicy buffalo chicken. Includes fries and salad', price: 12.99, size: '10"', category: 'sub', isAvailable: true },
  { name: 'Tuna Sub Combo', description: 'Tuna salad with lettuce and tomato. Includes fries and salad', price: 11.99, size: '10"', category: 'sub', isAvailable: true },
  
  // ========== OTHER COMBOS ==========
  { name: 'Gyro Sandwich Combo', description: 'Gyro meat, tzatziki sauce, lettuce, tomato, onion. Includes fries and salad', price: 12.99, category: 'combo', isAvailable: true },
  { name: 'Fish & Chips Combo', description: 'Battered fish with fries and coleslaw', price: 13.99, category: 'combo', isAvailable: true },
  { name: '1/2 lb Shrimp Combo', description: 'Half pound breaded shrimp with fries and salad', price: 15.99, category: 'combo', isAvailable: true },
  { name: 'Chicken Nuggets Combo', description: '15pc crispy chicken nuggets with fries', price: 11.99, size: '15pc', category: 'combo', isAvailable: true },
  { name: 'Cheeseburger Combo', description: '1/2 lb Angus patty, American cheese, lettuce, tomato, onion, mayo, ketchup, mustard on sesame bun. Includes fries', price: 12.99, category: 'combo', isAvailable: true },
  
  // ========== CALZONES ==========
  { name: 'Calzone', description: 'Choose any 3 toppings', price: 10.99, size: '10"', category: 'calzone', isAvailable: true },
  { name: 'Calzone', description: 'Choose any 3 toppings', price: 14.99, size: '14"', category: 'calzone', isAvailable: true },
  
  // ========== DRINKS ==========
  { name: 'Coca-Cola', description: '2 Liter bottle', price: 3.99, size: '2L', category: 'drink', isAvailable: true },
  { name: 'Coca-Cola', description: 'Can', price: 1.50, size: '355ml', category: 'drink', isAvailable: true },
  { name: 'Pepsi', description: '2 Liter bottle', price: 3.99, size: '2L', category: 'drink', isAvailable: true },
  { name: 'Pepsi', description: 'Can', price: 1.50, size: '355ml', category: 'drink', isAvailable: true },
  { name: 'Sprite', description: '2 Liter bottle', price: 3.99, size: '2L', category: 'drink', isAvailable: true },
  { name: 'Sprite', description: 'Can', price: 1.50, size: '355ml', category: 'drink', isAvailable: true },
  { name: 'Mountain Dew', description: '2 Liter bottle', price: 3.99, size: '2L', category: 'drink', isAvailable: true },
  { name: 'Mountain Dew', description: 'Can', price: 1.50, size: '355ml', category: 'drink', isAvailable: true },
  { name: 'Dr Pepper', description: '2 Liter bottle', price: 3.99, size: '2L', category: 'drink', isAvailable: true },
  { name: 'Dr Pepper', description: 'Can', price: 1.50, size: '355ml', category: 'drink', isAvailable: true },
  
  // ========== DESSERTS ==========
  { name: 'Cheesecake Slice', description: 'Rich and creamy New York style cheesecake', price: 4.99, category: 'dessert', isAvailable: true },
  { name: 'Gansito Cake', description: 'Mexican chocolate cake with strawberry filling', price: 2.99, category: 'dessert', isAvailable: true },
  
  // ========== SIDES & SAUCES ==========
  { name: 'Ranch Dressing', description: 'Side of ranch', price: 0.75, category: 'side', isAvailable: true },
  { name: 'House Dressing', description: 'Side of house dressing', price: 0.75, category: 'side', isAvailable: true },
  { name: 'BBQ Sauce', description: 'Side of BBQ sauce', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Italian Dressing', description: 'Side of Italian dressing', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Marinara Sauce', description: 'Side of marinara', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Gyro Sauce (Tzatziki)', description: 'Side of tzatziki', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Buffalo Sauce', description: 'Side of buffalo sauce', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Tartar Sauce', description: 'Side of tartar sauce', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Cocktail Sauce', description: 'Side of cocktail sauce', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Pepperoncini Peppers', description: 'Side of pepperoncini', price: 0.75, category: 'side', isAvailable: true },
  { name: 'Garlic Bread Slice', description: 'Single slice of garlic bread', price: 1.50, category: 'side', isAvailable: true },
];

async function seed() {
  try {
    console.log('🌱 Connecting to database...');
    await sequelize.sync({ alter: true }); 
    
    const count = await MenuItem.count();
    if (count > 0) {
      console.log('⚠️ Menu already has items. Clearing old data...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await MenuItem.destroy({ where: {}, truncate: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Old menu items cleared.');
    }
    
    await MenuItem.bulkCreate(items);
    console.log(`✅ Menu seeded successfully with ${items.length} items!`);
    console.log('📊 Breakdown:');
    console.log(`   - Pizzas: ${items.filter(i => i.category === 'pizza').length}`);
    console.log(`   - Wings: ${items.filter(i => i.category === 'wings').length}`);
    console.log(`   - Salads: ${items.filter(i => i.category === 'salad').length}`);
    console.log(`   - Appetizers: ${items.filter(i => i.category === 'appetizer').length}`);
    console.log(`   - Pasta: ${items.filter(i => i.category === 'pasta').length}`);
    console.log(`   - Subs: ${items.filter(i => i.category === 'sub').length}`);
    console.log(`   - Combos: ${items.filter(i => i.category === 'combo').length}`);
    console.log(`   - Calzones: ${items.filter(i => i.category === 'calzone').length}`);
    console.log(`   - Drinks: ${items.filter(i => i.category === 'drink').length}`);
    console.log(`   - Desserts: ${items.filter(i => i.category === 'dessert').length}`);
    console.log(`   - Sides: ${items.filter(i => i.category === 'side').length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await sequelize.close();
  }
}

seed();
