// frontend/components/menuRenderer.js
let menuItems = []; // Local state

export function renderMenuTab() {
  return `
    <div id="menu-grid" class="menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; padding: 2rem 0;">
      <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1/-1;">
        Loading menu...
      </div>
    </div>
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
    
    // CRITICAL: Share menu items with cart store FIRST
    if (typeof window.setMenuItems === 'function') {
      window.setMenuItems(menuItems);
      console.log('✅ Menu items shared with cart store');
    } else {
      console.warn('⚠️ window.setMenuItems not found');
    }
    
    // 🔥 RENDER IMMEDIATELY - no setTimeout!
    const container = document.getElementById('menu-grid');
    if (container) {
      console.log('🎨 Rendering menu to DOM...');
      renderMenu(menu, 'menu-grid');
      console.log('✅ Menu rendered to DOM');
    } else {
      console.error('❌ menu-grid container not found!');
    }
    
    // Update cart badge
    if (typeof window.updateCartCount === 'function') {
      window.updateCartCount();
    }
    
    return menu;
  } catch (error) {
    console.error('❌ Menu load failed:', error);
    const container = document.getElementById('menu-grid');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #dc3545; grid-column: 1/-1;">
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
  console.log('🎨 Rendering menu with', items.length, 'items');
  
  const pizzaGroups = {};
  const nonPizzas = [];
  
  items.forEach(item => {
    if (item.category === 'pizza') {
      const key = `${item.name}|${item.description}`;
      if (!pizzaGroups[key]) pizzaGroups[key] = [];
      pizzaGroups[key].push(item);
    } else {
      nonPizzas.push(item);
    }
  });

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('❌ Container not found:', containerId);
    return;
  }

  const pizzaGroupsArray = Object.values(pizzaGroups);
  console.log('🍕 Pizza groups:', pizzaGroupsArray.length);
  console.log('🥪 Other items:', nonPizzas.length);

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;">
        <h3>No menu items available</h3>
        <p>Check back soon!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 12px; margin-bottom: 2rem;">
      <h2 style="color: #ff6b35; margin: 0;">🍕 PIZZA SELECTION</h2>
      <p style="color: #666; margin: 0;">Choose pizza type, then select size!</p>
    </div>
    ${pizzaGroupsArray.map(group => pizzaGroupCard(group)).join('')}
    ${nonPizzas.length > 0 ? `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f0f8ff; border-radius: 12px; margin: 2rem 0;">
        <h2 style="color: #007bff; margin: 0;">🥪 OTHER ITEMS</h2>
      </div>
      ${nonPizzas.map(item => singleItemCard(item)).join('')}
    ` : ''}
  `;
  
  console.log('✅ Menu HTML injected into DOM');
}

function pizzaGroupCard(sizes) {
  const baseName = sizes[0].name;
  const description = sizes[0].description;
  
  // Sort sizes for consistent display
  sizes.sort((a, b) => {
    const sizeOrder = { '10"': 1, '16"': 2, '18"': 3, '28"': 4 };
    return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
  });
  
  const defaultSize = sizes.find(s => s.size === '16"') || sizes[0];
  
  return `
    <div class="menu-card">
      <h3 style="color: #ff6b35; margin: 0 0 0.5rem;">${baseName}</h3>
      <p style="color: #666; margin: 0 0 1rem; font-size: 0.95rem;">${description}</p>
      
      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #333;">Size:</label>
        <select class="size-selector" data-group-id="${sizes[0].id}" onchange="window.updatePizzaPrice(this)">
          ${sizes.map(size => `
            <option value="${size.id}" data-price="${size.price}" ${size.id === defaultSize.id ? 'selected' : ''}>
              ${size.size} - $${parseFloat(size.price).toFixed(2)}
            </option>
          `).join('')}
        </select>
      </div>
      
      <p id="pizza-price-${sizes[0].id}" style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 1rem 0;">
        $${parseFloat(defaultSize.price).toFixed(2)}
      </p>
      
      <button class="add-to-cart-btn" data-group-id="${sizes[0].id}" 
              onclick="window.addToCartPizza(this)"
              style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}

function singleItemCard(item) {
  return `
    <div class="menu-card">
      <h3 style="color: #007bff; margin: 0 0 0.5rem;">${item.name} 
        <span style="font-size: 0.8em; color: #666;">${item.size || ''}</span>
      </h3>
      <p style="color: #666; margin: 0 0 0.5rem; text-transform: uppercase; font-size: 0.9rem;">${item.category}</p>
      <p style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 0.5rem 0;">$${parseFloat(item.price).toFixed(2)}</p>
      ${item.description ? `<p style="color: #888; margin: 1rem 0 0; font-size: 0.9rem;">${item.description}</p>` : ''}
      <button onclick="window.addToCart(${item.id})" 
              style="width: 100%; background: #28a745; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}

// 👇 GLOBAL FUNCTIONS (for onclick handlers) 👇
export function initMenuGlobalFunctions() {
  console.log('🔧 Initializing menu global functions...');
  
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
      console.log('🍕 Adding pizza to cart, ID:', selectedId);
      window.addToCart(selectedId);
    } else {
      console.error('❌ Cannot add pizza: missing selector or addToCart function');
    }
  };
  
  console.log('✅ Menu global functions initialized');
}

// 👇 GETTERS 👇
export function getMenuItems() {
  return menuItems;
}

export function getMenuItemById(id) {
  return menuItems.find(item => item.id === id);
}
