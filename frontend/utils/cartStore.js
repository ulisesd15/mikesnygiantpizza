// frontend/utils/cartStore.js

// Cart is an array of line items
// Each item can optionally have toppings and a computed linePrice
let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
let menuItems = []; // Shared with menu renderer

// Set menu items (called from menuRenderer)
export function setMenuItems(items) {
  menuItems = items;
}

// 👇 CART OPERATIONS 👇

// Supports:
//   addToCart(123)  // legacy
//   addToCart({ menuItemId, name, size, basePrice, addedToppings, removedToppings }) // new
export function addToCart(itemOrConfig) {
  let config;

  if (typeof itemOrConfig === 'number') {
    // Legacy usage: addToCart(menuItemId)
    const id = parseInt(itemOrConfig);
    const item = menuItems.find(i => i.id === id);
    if (!item) return false;

    config = {
      menuItemId: item.id,
      name: item.name,
      size: item.size,
      basePrice: parseFloat(item.basePrice ?? item.price ?? 0),
      addedToppings: [],
      removedToppings: []
    };
  } else {
    // New usage: addToCart({ ...config })
    config = itemOrConfig || {};
  }

  const {
    menuItemId,
    name = 'Item',
    size,
    basePrice = 0,
    addedToppings = [],
    removedToppings = []
  } = config;

  // Build stable key so same pizza + same toppings stack
  const toppingsKey = JSON.stringify({
    add: addedToppings.map(t => t.id).sort(),
    remove: removedToppings.map(t => t.id).sort()
  });

  const lineId = `${menuItemId}_${size || ''}_${toppingsKey}`;

  const extra = addedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
  const unitPrice = basePrice + extra;

  const existing = cart.find(c => c.id === lineId);

  if (existing) {
    existing.quantity += 1;
    existing.linePrice = unitPrice * existing.quantity;
    showToast(`Added another ${name} to cart!`);
  } else {
    cart.push({
      id: lineId,
      menuItemId,
      name,
      size,
      basePrice,
      quantity: 1,
      addedToppings,
      removedToppings,
      linePrice: unitPrice
    });
    showToast(`Added ${name} to cart! 🛍️`);
  }

  saveAndRefresh();
  return true;
}

export function updateCartQuantity(itemId, quantity) {
  const id = String(itemId);
  const item = cart.find(c => c.id === id);
  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }

  item.quantity = quantity;
  const extra = item.addedToppings?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;
  const unitPrice = item.basePrice + extra;
  item.linePrice = unitPrice * item.quantity;

  saveAndRefresh();
}

export function removeFromCart(itemId) {
  const id = String(itemId);
  cart = cart.filter(c => c.id !== id);
  saveAndRefresh();
}

export function clearCart() {
  cart = [];
  saveAndRefresh();
}


// Helper to save and update UI
function saveAndRefresh() {
  localStorage.setItem('pizzaCart', JSON.stringify(cart));
  updateCartCount();

  // If drawer is open, re-render it
  const drawer = document.getElementById('cart-drawer');
  if (drawer && drawer.style.right === '0px') {
    renderCart();
  }
}

export function getCartCount() {
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function getCartTotal() {
  return cart.reduce(
    (sum, item) =>
      sum +
      (typeof item.linePrice === 'number'
        ? item.linePrice
        : (item.price || item.basePrice || 0) * (item.quantity || 1)),
    0
  );
}

export function getCart() {
  return cart;
}

// 👇 DOM FUNCTIONS (called by cartDrawer) 👇
export function renderCart() {
  const container = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');

  if (!container || !subtotalEl) return;

  if (cart.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty 🍕</p>';
    subtotalEl.textContent = '0.00';
    return;
  }

  container.innerHTML = cart
    .map(item => {
      const qty = item.quantity || 1;
      const unitPrice =
        item.linePrice && qty
          ? item.linePrice / qty
          : item.price || item.basePrice || 0;

      const added =
        item.addedToppings?.length
          ? `<div style="font-size: 0.8rem; color: #28a745;">+ ${item.addedToppings
              .map(t => t.name)
              .join(', ')}</div>`
          : '';

      const removed =
        item.removedToppings?.length
          ? `<div style="font-size: 0.8rem; color: #dc3545;">− ${item.removedToppings
              .map(t => t.name)
              .join(', ')}</div>`
          : '';

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #eee;">
          <div>
            <h4 style="margin: 0 0 0.25rem;">${item.name} ${
        item.size ? `(${item.size})` : ''
      }</h4>
            <p style="margin: 0; color: #28a745; font-weight: bold;">$${unitPrice.toFixed(
              2
            )}</p>
            ${added}
            ${removed}
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button onclick="window.updateCartQuantity('${item.id}', ${qty - 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px;">−</button>
            <span style="min-width: 24px; text-align: center; font-weight: bold;">${qty}</span>
            <button onclick="window.updateCartQuantity('${item.id}', ${qty + 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px;">+</button>
            <button onclick="window.removeFromCart('${item.id}')" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px;">×</button>
            <span style="font-weight: bold;">$${(
              item.linePrice || unitPrice * qty
            ).toFixed(2)}</span>
          </div>
        </div>
      `;
    })
    .join('');

  const subtotal = getCartTotal();
  subtotalEl.textContent = subtotal.toFixed(2);
}

export function updateCartCount() {
  const count = getCartCount();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;

  // Also update checkout button state in cart drawer
  if (window.updateCheckoutButton) {
    window.updateCheckoutButton();
  }
}

// 👇 UI HELPERS 👇
export function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 2rem; right: 2rem; background: #28a745; 
    color: white; padding: 1rem 2rem; border-radius: 8px; 
    z-index: 1001; transform: translateX(400px); transition: transform 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.transform = 'translateX(0)'), 10);
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

// 👇 GLOBAL EXPORTS (for onclick handlers) 👇
export function initGlobalFunctions() {
  window.addToCart = addToCart;
  window.updateCartQuantity = updateCartQuantity;
  window.removeFromCart = removeFromCart;
  window.renderCart = renderCart;
  window.updateCartCount = updateCartCount;
  window.showToast = showToast;
  window.setMenuItems = setMenuItems;
  window.getCartCount = getCartCount; // Export for cart drawer
  window.getCart = getCart; // Export for checkout
  window.getCartTotal = getCartTotal; // Export for checkout
  window.clearCart = clearCart; // Export for checkout
}

