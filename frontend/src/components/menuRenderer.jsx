// frontend/components/menuRenderer.js
import { API_ROUTES, apiUrl } from '../../config';

// Local state
let menuItems = [];
let currentCategory = 'all';

function toItemId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function getCustomizationUrl(itemId) {
  const id = toItemId(itemId);
  if (id === null) {
    throw new Error(`Invalid menu item id: ${String(itemId)}`);
  }
  return apiUrl(`/menu/${id}/customization`);
}

// View shell
export function renderMenuTab() {
  return `
    <div style="max-width: 1400px; margin: 0 auto;">
      <div id="category-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; flex-wrap: wrap; justify-content: center;">
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
        <button onclick="window.filterCategory('all')" class="category-tab active" data-category="all">🍽️ All Items</button>
      </div>

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
        grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
        gap: 1.5rem;
      }
      .compact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
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

function normalizeMenuResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

// Data loading
export async function loadMenu() {
  try {
    console.log('🔄 Fetching menu from API...');
    const response = await fetch(apiUrl('/menu'));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const payload = await response.json();
    const menu = normalizeMenuResponse(payload);

    console.log('✅ Menu loaded:', menu.length, 'items');

    menuItems = menu;

    if (typeof window.setMenuItems === 'function') {
      window.setMenuItems(menuItems);
      console.log('✅ Menu items shared with cart store');
    }

    const container = document.getElementById('menu-grid');
    if (container) {
      console.log('🎨 Rendering menu to DOM...');
      renderMenu(menuItems, 'menu-grid');
      console.log('✅ Menu rendered to DOM');
    }

    if (typeof window.updateCartCount === 'function') {
      window.updateCartCount();
    }

    return menuItems;
  } catch (error) {
    console.error('❌ Menu load failed:', error);
    const container = document.getElementById('menu-grid');

    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #dc3545;">
          <h3>Failed to load menu</h3>
          <p>${error.message}</p>
          <button onclick="window.retryLoadMenu()" style="background: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">
            Retry
          </button>
        </div>
      `;
    }

    return [];
  }
}

// Main rendering
export function renderMenu(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

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

  items.forEach((item) => {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  });

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

  container.innerHTML =
    html || '<div style="text-align: center; padding: 3rem; color: #666;">No items in this category</div>';
}

// Section renderers
function renderPizzaSection(pizzas) {
  if (!pizzas || pizzas.length === 0) return '';

  const pizzaGroups = {};
  pizzas.forEach((pizza) => {
    const key = `${pizza.name}|${pizza.description || ''}`;
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
        ${groups.map((group) => pizzaGroupCard(group)).join('')}
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
        ${items.map((item) => singleItemCard(item, cardClass)).join('')}
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
        ${items.map((item) => `
          <div class="menu-card compact-card" style="padding: 0.75rem; text-align: center;">
            <h4 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: #333;">${item.name}</h4>
            ${item.size ? `<p style="margin: 0; font-size: 0.75rem; color: #999;">${item.size}</p>` : ''}
            <p style="margin: 0.5rem 0; font-size: 1.1rem; color: #28a745; font-weight: bold;">$${parseFloat(item.price || 0).toFixed(2)}</p>
            <button onclick="window.addToCart(${item.id})" style="width: 100%; background: #28a745; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;">
              Add
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Card renderers
function pizzaGroupCard(sizes) {
  const sortedSizes = [...sizes].sort((a, b) => {
    const sizeOrder = { '14"': 1, '16"': 2, '20"': 3, '28"': 4 };
    return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
  });

  const baseName = sortedSizes[0]?.name || 'Pizza';
  const description = sortedSizes[0]?.description || '';
  const defaultSize = sortedSizes.find((s) => s.size === '16"') || sortedSizes[0];
  const groupId = sortedSizes[0]?.id;

  return `
    <div class="menu-card">
      <h3 style="color: #ff6b35; margin: 0 0 0.5rem; font-size: 1.3rem;">${baseName}</h3>
      <p style="color: #666; margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.4;">${description}</p>

      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 0.9rem;">Select Size:</label>
        <select
          class="size-selector"
          data-group-id="${groupId}"
          onchange="window.updatePizzaPrice(this)"
          style="width: 100%; padding: 0.75rem; border: 2px solid #ff6b35; border-radius: 8px; background: white; font-size: 1rem; font-weight: 500;"
        >
          ${sortedSizes.map((size) => `
            <option value="${size.id}" data-price="${size.price}" ${size.id === defaultSize.id ? 'selected' : ''}>
              ${size.size} - $${parseFloat(size.price || 0).toFixed(2)}
            </option>
          `).join('')}
        </select>
      </div>

      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Price:</p>
        <p id="pizza-price-${groupId}" style="font-size: 2rem; color: #28a745; font-weight: bold; margin: 0.25rem 0 0;">
          $${parseFloat(defaultSize?.price || 0).toFixed(2)}
        </p>
      </div>

      <button
        class="add-to-cart-btn"
        data-group-id="${groupId}"
        onclick="window.customizePizzaAndAdd(this)"
        style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;"
      >
        ➕ Customize & Add
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
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-top: auto; flex-wrap: wrap;">
        <p style="font-size: 1.5rem; color: #28a745; font-weight: bold; margin: 0;">$${parseFloat(item.price || 0).toFixed(2)}</p>
        <button
          onclick="window.addToCart(${item.id})"
          style="background: #28a745; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;"
        >
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

// Menu actions
window.customizePizzaAndAdd = async (btn) => {
  const groupId = btn?.dataset?.groupId;
  const sizeSelect = document.querySelector(`.size-selector[data-group-id="${groupId}"]`);
  if (!sizeSelect) return;

  const selectedId = toItemId(sizeSelect.value);
  if (selectedId === null) return;

  try {
    const res = await fetch(getCustomizationUrl(selectedId));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json();
    const data = payload?.data || payload;

    const itemInfo = menuItems.find((i) => i.id === selectedId) || {
      id: selectedId,
      menuItemId: selectedId,
      name: 'Pizza',
      size: '',
      price: 0,
      basePrice: 0
    };

    if (typeof window.showItemCustomizationModal === 'function') {
      window.showItemCustomizationModal(data, itemInfo);
      return;
    }

    if (window.addToCart) {
      window.addToCart(selectedId);
    }
  } catch (err) {
    console.error('Failed to load customization data:', err);
    if (window.showToast) {
      window.showToast('Pizza customization is unavailable right now');
    }
    if (window.addToCart) {
      window.addToCart(selectedId);
    }
  }
};

// Global UI handlers
// Global UI handlers
export function initMenuGlobalFunctions() {
  console.log('🔧 Initializing menu global functions...');

  window.retryLoadMenu = () => loadMenu();

  window.filterCategory = (category) => {
    currentCategory = category;

    document.querySelectorAll('.category-tab').forEach((tab) => {
      tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    renderMenu(menuItems, 'menu-grid');

    const menuGrid = document.getElementById('menu-grid');
    if (menuGrid) {
      menuGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window.updatePizzaPrice = (select) => {
    const groupId = select.dataset.groupId;
    const priceEl = document.getElementById(`pizza-price-${groupId}`);
    const selectedOption = select.options[select.selectedIndex];

    if (priceEl && selectedOption) {
      priceEl.textContent = `$${parseFloat(selectedOption.dataset.price || 0).toFixed(2)}`;
    }
  };

  // Backward-compatible alias if you start using one shared handler name
  window.updateItemPrice = (select) => {
    const itemId = select.dataset.itemId || select.dataset.groupId;
    const priceEl =
      document.getElementById(`item-price-${itemId}`) ||
      document.getElementById(`pizza-price-${itemId}`);
    const selectedOption = select.options[select.selectedIndex];

    if (priceEl && selectedOption) {
      priceEl.textContent = `$${parseFloat(selectedOption.dataset.price || 0).toFixed(2)}`;
    }
  };

  window.addToCartPizza = (btn) => {
    const groupId = btn.dataset.groupId;
    const sizeSelect = document.querySelector(`.size-selector[data-group-id="${groupId}"]`);

    if (sizeSelect && window.addToCart) {
      const selectedId = parseInt(sizeSelect.value, 10);
      if (Number.isInteger(selectedId)) {
        window.addToCart(selectedId);
      }
    }
  };

  // Universal customization launcher
  window.customizeItemAndAdd = async (btn) => {
    const rawItemId = btn?.dataset?.itemId;
    const rawGroupId = btn?.dataset?.groupId;

    const itemId = toItemId(rawItemId || rawGroupId);
    if (itemId === null) return;

    const sizeSelect =
      document.querySelector(`.size-selector[data-item-id="${itemId}"]`) ||
      document.querySelector(`.size-selector[data-group-id="${itemId}"]`);

    const selectedId = sizeSelect ? toItemId(sizeSelect.value) : itemId;
    if (selectedId === null) return;

    try {
      const res = await fetch(getCustomizationUrl(selectedId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();
      const data = payload?.data || payload;

      const itemInfo =
        menuItems.find((i) => i.id === selectedId) ||
        menuItems.find((i) => i.id === itemId) || {
          id: selectedId,
          menuItemId: selectedId,
          name: 'Item',
          size: '',
          price: 0,
          basePrice: 0
        };

      if (typeof window.showItemCustomizationModal === 'function') {
        window.showItemCustomizationModal(data, itemInfo);
        return;
      }

      window.dispatchEvent(
        new CustomEvent('pizza-customize-open', {
          detail: data
        })
      );
    } catch (err) {
      console.error('Failed to load customization data:', err);

      if (window.showToast) {
        window.showToast('Customization is unavailable right now');
      }

      if (window.addToCart) {
        window.addToCart(selectedId);
      }
    }
  };
  // Modal renderer hook
  window.showItemCustomizationModal = (customData, itemInfo) => {
  const existing = document.getElementById('item-customization-modal');
  if (existing) existing.remove();

  const basePrice = parseFloat(itemInfo?.basePrice ?? itemInfo?.price ?? 0);

  const mandatory = Array.isArray(customData?.mandatory) ? customData.mandatory : [];
  const optional = Array.isArray(customData?.optional) ? customData.optional : [];
  const itemPrices = customData?.itemPrices || {};

  const modal = document.createElement('div');
  modal.id = 'item-customization-modal';
  modal.dataset.basePrice = String(basePrice);
  modal.dataset.menuItemId = String(itemInfo?.id ?? '');

  modal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    ">
      <div style="
        width: 100%;
        max-width: 560px;
        max-height: min(90dvh, 90vh);
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        overflow: hidden;
      ">
        <div style="
          padding: 1.25rem 1.25rem 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          flex-shrink: 0;
        ">
          <div>
            <h2 style="margin: 0; color: #ff6b35; font-size: 1.35rem;">
              Customize ${itemInfo?.name || 'Item'}
            </h2>
            ${itemInfo?.size ? `<p style="margin: 0.35rem 0 0; color: #666;">Size: ${itemInfo.size}</p>` : ''}
          </div>
          <button
            onclick="window.closeItemCustomizationModal()"
            aria-label="Close customization modal"
            style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;"
          >
            ×
          </button>
        </div>

        <div style="padding: 1.25rem; overflow-y: auto; flex: 1; min-height: 0;">
          ${
            mandatory.length
              ? `
                <div style="margin-bottom: 1.5rem;">
                  <h3 style="margin: 0 0 0.75rem; font-size: 1rem; color: #333;">Original ingredients</h3>
                  <p style="margin: 0 0 0.75rem; font-size: 0.85rem; color: #777;">Included by default. Uncheck to remove.</p>
                  <div style="display: grid; gap: 0.5rem;">
                    ${mandatory.map((ingredient) => {
                      const price = parseFloat(itemPrices[ingredient.id] || ingredient.price || 0);
                      return `
                        <label
                          class="custom-ingredient-row"
                          data-role="mandatory"
                          data-id="${ingredient.id}"
                          data-name="${ingredient.name}"
                          data-price="${price}"
                          style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0.9rem; border: 1px solid #e5e5e5; border-radius: 10px; cursor: pointer;"
                        >
                          <span style="font-weight: 500; color: #333;">${ingredient.name}</span>
                          <span style="display: flex; align-items: center; gap: 0.5rem;">
                            <small style="color: #888;">Remove</small>
                            <input type="checkbox" checked onchange="window.updateCustomizationPrice()" />
                          </span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `
              : ''
          }

          ${
            optional.length
              ? `
                <div>
                  <h3 style="margin: 0 0 0.75rem; font-size: 1rem; color: #333;">Add extras</h3>
                  <p style="margin: 0 0 0.75rem; font-size: 0.85rem; color: #777;">Select any extra ingredients you want.</p>
                  <div style="display: grid; gap: 0.5rem; max-height: 320px; overflow-y: auto;">
                    ${optional.map((ingredient) => {
                      const price = parseFloat(itemPrices[ingredient.id] || ingredient.price || 0);
                      return `
                        <label
                          class="custom-ingredient-row"
                          data-role="optional"
                          data-id="${ingredient.id}"
                          data-name="${ingredient.name}"
                          data-price="${price}"
                          style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0.9rem; border: 1px solid #e5e5e5; border-radius: 10px; cursor: pointer;"
                        >
                          <span style="font-weight: 500; color: #333;">${ingredient.name}</span>
                          <span style="display: flex; align-items: center; gap: 0.5rem;">
                            <small style="color: #28a745;">${price > 0 ? `+$${price.toFixed(2)}` : 'Included'}</small>
                            <input type="checkbox" onchange="window.updateCustomizationPrice()" />
                          </span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `
              : '<p style="margin: 0; color: #666;">No extra customizations available for this item.</p>'
          }
        </div>

        <div style="
          padding: 1rem 1.25rem 1.25rem;
          border-top: 1px solid #eee;
          background: #fafafa;
          flex-shrink: 0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 0.95rem; color: #666;">Total</span>
            <strong id="customization-total-price" style="font-size: 1.5rem; color: #28a745;">$${basePrice.toFixed(2)}</strong>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button
              onclick="window.closeItemCustomizationModal()"
              style="flex: 1 1 220px; background: #6c757d; color: white; border: none; padding: 0.9rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;"
            >
              Cancel
            </button>
            <button
              onclick="window.confirmCustomizedItem()"
              style="flex: 1 1 220px; background: #ff6b35; color: white; border: none; padding: 0.9rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  window.__currentCustomizationItem = itemInfo;
  window.updateCustomizationPrice();
};

  window.closeItemCustomizationModal = () => {
    const modal = document.getElementById('item-customization-modal');
    if (modal) modal.remove();
    window.__currentCustomizationItem = null;
  };

  window.updateCustomizationPrice = () => {
    const modal = document.getElementById('item-customization-modal');
    if (!modal) return;

    const basePrice = parseFloat(modal.dataset.basePrice || 0);

    const addedToppings = Array.from(
      modal.querySelectorAll('.custom-ingredient-row[data-role="optional"] input:checked')
    ).map((input) => {
      const row = input.closest('.custom-ingredient-row');
      return parseFloat(row?.dataset?.price || 0);
    });

    const extrasTotal = addedToppings.reduce((sum, price) => sum + price, 0);
    const total = basePrice + extrasTotal;

    const totalEl = document.getElementById('customization-total-price');
    if (totalEl) {
      totalEl.textContent = `$${total.toFixed(2)}`;
    }
  };

  window.confirmCustomizedItem = () => {
    const modal = document.getElementById('item-customization-modal');
    const itemInfo = window.__currentCustomizationItem;

    if (!modal || !itemInfo || !window.addToCart) return;

    const addedToppings = Array.from(
      modal.querySelectorAll('.custom-ingredient-row[data-role="optional"] input:checked')
    ).map((input) => {
      const row = input.closest('.custom-ingredient-row');
      return {
        id: parseInt(row.dataset.id, 10),
        name: row.dataset.name,
        price: parseFloat(row.dataset.price || 0)
      };
    });

    const removedToppings = Array.from(
      modal.querySelectorAll('.custom-ingredient-row[data-role="mandatory"] input:not(:checked)')
    ).map((input) => {
      const row = input.closest('.custom-ingredient-row');
      return {
        id: parseInt(row.dataset.id, 10),
        name: row.dataset.name,
        price: 0
      };
    });
 
    const cartPayload = {
      menuItemId: toItemId(itemInfo.id),
      id: toItemId(itemInfo.id),
      name: itemInfo.name,
      size: itemInfo.size,
      basePrice: parseFloat(itemInfo.basePrice ?? itemInfo.price ?? 0),
      price: parseFloat(itemInfo.basePrice ?? itemInfo.price ?? 0),
      addedToppings,
      removedToppings
    };

    try {
      window.addToCart(cartPayload);
    } catch (error) {
      console.warn('Object addToCart failed, falling back to item id:', error);
      if (cartPayload.menuItemId !== null) {
        window.addToCart(cartPayload.menuItemId);
      }
}

    window.closeItemCustomizationModal();
  };

  console.log('✅ Menu global functions initialized');
}

// State accessors
export function getMenuItems() {
  return menuItems;
}

export function getMenuItemById(id) {
  return menuItems.find((item) => item.id === id);
}
