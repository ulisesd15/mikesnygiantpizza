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
    const menu = await fetch('/api/menu').then(r => r.json());
    menuItems = menu;
    
    // Share with cart store
    if (typeof window.setMenuItems === 'function') {
      window.setMenuItems(menuItems);
    }
    
    renderMenu(menu, 'menu-grid');
    window.updateCartCount?.(); // Update cart badge
    return menu;
  } catch (error) {
    console.error('Menu load failed:', error);
    return [];
  }
}

export function renderMenu(items, containerId) {
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
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 12px; margin-bottom: 2rem;">
      <h2 style="color: #ff6b35; margin: 0;">🍕 PIZZA SELECTION</h2>
      <p style="color: #666; margin: 0;">Choose pizza type, then select size!</p>
    </div>
    ${Object.values(pizzaGroups).map(group => pizzaGroupCard(group)).join('')}
    ${nonPizzas.length > 0 ? `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f0f8ff; border-radius: 12px; margin: 2rem 0;">
        <h2 style="color: #007bff; margin: 0;">🥪 OTHER ITEMS</h2>
      </div>
      ${nonPizzas.map(item => singleItemCard(item)).join('')}
    ` : ''}
  `;
}

function pizzaGroupCard(sizes) {
  const baseName = sizes[0].name;
  const description = sizes[0].description;
  
  return `
    <div class="menu-card">
      <h3 style="color: #ff6b35; margin: 0 0 0.5rem;">${baseName}</h3>
      <p style="color: #666; margin: 0 0 1rem; font-size: 0.95rem;">${description}</p>
      
      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #333;">Size:</label>
        <select class="size-selector" data-group-id="${sizes[0].id}" onchange="window.updatePizzaPrice(this)">
          ${sizes.map(size => `
            <option value="${size.id}" data-price="${size.price}">
              ${size.size} - $${parseFloat(size.price).toFixed(2)}
            </option>
          `).join('')}
        </select>
      </div>
      
      <p id="pizza-price-${sizes[0].id}" style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 1rem 0;">
        $${sizes.find(s => s.size === '16"')?.price || sizes[0].price}
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
      window.addToCart(sizeSelect.value);
    }
  };
}

// 👇 GETTERS 👇
export function getMenuItems() {
  return menuItems;
}

export function getMenuItemById(id) {
  return menuItems.find(item => item.id === id);
}

