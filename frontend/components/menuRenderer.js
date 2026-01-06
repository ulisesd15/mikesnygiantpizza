// frontend/components/menuRenderer.js
let menuItems = []; // Local state
let currentCategory = 'all'; // Track current filter

export function renderMenuTab() {
  return `
    <div style="max-width: 1400px; margin: 0 auto;">
      <!-- Category Filter Tabs -->
      <div id="category-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; flex-wrap: wrap; justify-content: center;">
        <button onclick="window.filterCategory('all')" class="category-tab active" data-category="all">🍽️ All Items</button>
        <button onclick="window.filterCategory('pizza')" class="category-tab" data-category="pizza">🍕 Pizzas</button>
        <button onclick="window.filterCategory('wings')" class="category-tab" data-category="wings">🍗 Wings</button>
        <button onclick="window.filterCategory('salad')" class="category-tab" data-category="salad">🥗 Salads</button>
        <button onclick="window.filterCategory('appetizer')" class="category-tab" data-category="appetizer">🧈 Appetizers</button>
        <button onclick="window.filterCategory('pasta')" class="category-tab" data-category="pasta">🍝 Pasta</button>
        <button onclick="window.filterCategory('sub')" class="category-tab" data-category="sub">🥖 Subs</button>
        <button onclick="window.filterCategory('combo')" class="category-tab" data-category="combo">🍔 Combos</button>
        <button onclick="window.filterCategory('calzone')" class="category-tab" data-category="calzone">🥙 Calzones</button>
        <button onclick="window.filterCategory('drink')" class="category-tab" data-category="drink">🥤 Drinks</button>
        <button onclick="window.filterCategory('dessert')" class="category-tab" data-category="dessert">🍰 Desserts</button>
        <button onclick="window.filterCategory('side')" class="category-tab" data-category="side">🧂 Sides</button>
      </div>

      <!-- Menu Container -->
      <div id="menu-grid" style="padding: 1rem 0;">
        <div style="text-align: center; padding: 3rem; color: #666;">
          Loading menu...
        </div>
      </div>
    </div>

    <style>
      .category-tab {
        padding: 0.75rem 1.5rem;
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.3s;
        white-space: nowrap;
      }
      .category-tab:hover {
        background: #f8f9fa;
        border-color: #ff6b35;
      }
      .category-tab.active {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
      }
      .menu-section {
        margin-bottom: 3rem;
      }
      .menu-section-title {
        background: linear-gradient(135deg, #ff6b35, #ff8c61);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        text-align: center;
      }
      .menu-section-title h2 {
        margin: 0;
        font-size: 1.8rem;
      }
      .menu-section-title p {
        margin: 0.5rem 0 0;
        opacity: 0.9;
      }
      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }
      .compact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }
      .menu-card {
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 1.5rem;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s;
      }
      .menu-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      }
      .compact-card {
        padding: 1rem;
      }
      .compact-card h3 {
        font-size: 1rem !important;
      }
      .item-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }
    </style>
  `;
}

export async function loadMenu() {
  try {
    console.log('🔄 Fetching menu from API...');
    const response = await fetch('/api/menu');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const menu = await response.json();
    console.log('✅ Menu loaded:', menu.length, 'items');
    
    menuItems = menu;
    
    // Share menu items with cart store
    if (typeof window.setMenuItems === 'function') {
      window.setMenuItems(menuItems);
      console.log('✅ Menu items shared with cart store');
    }
    
    // Render menu
    const container = document.getElementById('menu-grid');
    if (container) {
      console.log('🎨 Rendering menu to DOM...');
      renderMenu(menu, 'menu-grid');
      console.log('✅ Menu rendered to DOM');
    }
    
    if (typeof window.updateCartCount === 'function') {
      window.updateCartCount();
    }
    
    return menu;
  } catch (error) {
    console.error('❌ Menu load failed:', error);
    const container = document.getElementById('menu-grid');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #dc3545;">
          <h3>Failed to load menu</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">Retry</button>
        </div>
      `;
    }
    return [];
  }
}

export function renderMenu(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Group items by category
  const grouped = {
    pizza: [],
    wings: [],
    salad: [],
    appetizer: [],
    pasta: [],
    sub: [],
    combo: [],
    calzone: [],
    drink: [],
    dessert: [],
    side: []
  };

  items.forEach(item => {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  });

  // Filter based on current category
  let html = '';

  if (currentCategory === 'all' || currentCategory === 'pizza') {
    html += renderPizzaSection(grouped.pizza);
  }
  if (currentCategory === 'all' || currentCategory === 'wings') {
    html += renderCategorySection('🍗 Chicken Wings', grouped.wings, 'Choose your size and sauce!');
  }
  if (currentCategory === 'all' || currentCategory === 'salad') {
    html += renderCategorySection('🥗 Fresh Salads', grouped.salad, 'Healthy and delicious options');
  }
  if (currentCategory === 'all' || currentCategory === 'appetizer') {
    html += renderCategorySection('🧈 Appetizers', grouped.appetizer, 'Start your meal right', true);
  }
  if (currentCategory === 'all' || currentCategory === 'pasta') {
    html += renderCategorySection('🍝 Pasta Dishes', grouped.pasta, 'Authentic Italian favorites');
  }
  if (currentCategory === 'all' || currentCategory === 'sub') {
    html += renderCategorySection('🥖 Sub Combos (10")', grouped.sub, 'Includes fries and salad');
  }
  if (currentCategory === 'all' || currentCategory === 'combo') {
    html += renderCategorySection('🍔 Combo Meals', grouped.combo, 'Complete meals with sides');
  }
  if (currentCategory === 'all' || currentCategory === 'calzone') {
    html += renderCategorySection('🥙 Calzones', grouped.calzone, 'Choose any 3 toppings');
  }
  if (currentCategory === 'all' || currentCategory === 'drink') {
    html += renderCompactSection('🥤 Beverages', grouped.drink);
  }
  if (currentCategory === 'all' || currentCategory === 'dessert') {
    html += renderCategorySection('🍰 Desserts', grouped.dessert, 'Sweet treats to finish your meal', true);
  }
  if (currentCategory === 'all' || currentCategory === 'side') {
    html += renderCompactSection('🧂 Sides & Sauces', grouped.side);
  }

  container.innerHTML = html || '<div style="text-align: center; padding: 3rem; color: #666;">No items in this category</div>';
}

function renderPizzaSection(pizzas) {
  if (!pizzas || pizzas.length === 0) return '';

  // Group pizzas by name
  const pizzaGroups = {};
  pizzas.forEach(pizza => {
    const key = `${pizza.name}|${pizza.description}`;
    if (!pizzaGroups[key]) pizzaGroups[key] = [];
    pizzaGroups[key].push(pizza);
  });

  const groups = Object.values(pizzaGroups);

  return `
    <div class="menu-section">
      <div class="menu-section-title">
        <h2>🍕 Our Pizzas</h2>
        <p>Choose your favorite pizza and select your size!</p>
      </div>
      <div class="menu-grid">
        ${groups.map(group => pizzaGroupCard(group)).join('')}
      </div>
    </div>
  `;
}

function renderCategorySection(title, items, subtitle = '', compact = false) {
  if (!items || items.length === 0) return '';

  const gridClass = compact ? 'compact-grid' : 'menu-grid';
  const cardClass = compact ? 'compact-card' : '';

  return `
    <div class="menu-section">
      <div class="menu-section-title" style="background: linear-gradient(135deg, #007bff, #0056b3);">
        <h2>${title}</h2>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
      <div class="${gridClass}">
        ${items.map(item => singleItemCard(item, cardClass)).join('')}
      </div>
    </div>
  `;
}

function renderCompactSection(title, items) {
  if (!items || items.length === 0) return '';

  return `
    <div class="menu-section">
      <div class="menu-section-title" style="background: linear-gradient(135deg, #6c757d, #495057);">
        <h2>${title}</h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
        ${items.map(item => `
          <div class="menu-card compact-card" style="padding: 0.75rem; text-align: center;">
            <h4 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: #333;">${item.name}</h4>
            ${item.size ? `<p style="margin: 0; font-size: 0.75rem; color: #999;">${item.size}</p>` : ''}
            <p style="margin: 0.5rem 0; font-size: 1.1rem; color: #28a745; font-weight: bold;">$${parseFloat(item.price).toFixed(2)}</p>
            <button onclick="window.addToCart(${item.id})" style="width: 100%; background: #28a745; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;">Add</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function pizzaGroupCard(sizes) {
  const baseName = sizes[0].name;
  const description = sizes[0].description;
  
  // Sort sizes
  sizes.sort((a, b) => {
    const sizeOrder = { '14"': 1, '16"': 2, '20"': 3, '28"': 4 };
    return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
  });
  
  const defaultSize = sizes.find(s => s.size === '16"') || sizes[0];
  
  return `
    <div class="menu-card">
      <h3 style="color: #ff6b35; margin: 0 0 0.5rem; font-size: 1.3rem;">${baseName}</h3>
      <p style="color: #666; margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.4;">${description}</p>
      
      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 0.9rem;">Select Size:</label>
        <select class="size-selector" data-group-id="${sizes[0].id}" onchange="window.updatePizzaPrice(this)" style="width: 100%; padding: 0.75rem; border: 2px solid #ff6b35; border-radius: 8px; background: white; font-size: 1rem; font-weight: 500;">
          ${sizes.map(size => `
            <option value="${size.id}" data-price="${size.price}" ${size.id === defaultSize.id ? 'selected' : ''}>
              ${size.size} - $${parseFloat(size.price).toFixed(2)}
            </option>
          `).join('')}
        </select>
      </div>
      
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Price:</p>
        <p id="pizza-price-${sizes[0].id}" style="font-size: 2rem; color: #28a745; font-weight: bold; margin: 0.25rem 0 0;">
          $${parseFloat(defaultSize.price).toFixed(2)}
        </p>
      </div>
      
      <button class="add-to-cart-btn" data-group-id="${sizes[0].id}" 
              onclick="window.addToCartPizza(this)"
              style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}

function singleItemCard(item, extraClass = '') {
  return `
    <div class="menu-card ${extraClass}">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="color: #007bff; margin: 0; font-size: 1.1rem;">${item.name}</h3>
        ${item.size ? `<span style="font-size: 0.85rem; color: #666; font-weight: 500;">${item.size}</span>` : ''}
      </div>
      ${item.description ? `<p style="color: #666; margin: 0 0 0.75rem; font-size: 0.875rem; line-height: 1.4;">${item.description}</p>` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
        <p style="font-size: 1.5rem; color: #28a745; font-weight: bold; margin: 0;">$${parseFloat(item.price).toFixed(2)}</p>
        <button onclick="window.addToCart(${item.id})" 
                style="background: #28a745; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

// Global functions
export function initMenuGlobalFunctions() {
  console.log('🔧 Initializing menu global functions...');
  
  window.filterCategory = (category) => {
    currentCategory = category;
    
    // Update tab styles
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Re-render menu
    renderMenu(menuItems, 'menu-grid');
    
    // Scroll to top of menu
    document.getElementById('menu-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.updatePizzaPrice = (select) => {
    const groupId = select.dataset.groupId;
    const priceEl = document.getElementById(`pizza-price-${groupId}`);
    const selectedOption = select.options[select.selectedIndex];
    if (priceEl) {
      priceEl.textContent = `$${parseFloat(selectedOption.dataset.price).toFixed(2)}`;
    }
  };

  window.addToCartPizza = (btn) => {
    const groupId = btn.dataset.groupId;
    const sizeSelect = document.querySelector(`.size-selector[data-group-id="${groupId}"]`);
    if (sizeSelect && window.addToCart) {
      const selectedId = parseInt(sizeSelect.value);
      window.addToCart(selectedId);
    }
  };
  
  console.log('✅ Menu global functions initialized');
}

export function getMenuItems() {
  return menuItems;
}

export function getMenuItemById(id) {
  return menuItems.find(item => item.id === id);
}
