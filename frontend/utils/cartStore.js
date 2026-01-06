// frontend/utils/cartStore.js
let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
let menuItems = []; // Shared with menu renderer

// Set menu items (called from menuRenderer)
export function setMenuItems(items) {
  menuItems = items;
}

// 👇 CART OPERATIONS 👇
export function addToCart(itemId) {
  const id = parseInt(itemId); // Ensure ID is a number
  const item = menuItems.find(i => i.id === id);
  
  if (!item) return false;
  
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.quantity += 1;
    showToast(`Added another ${item.name} to cart!`);
  } else {
    // Use the clean ID and spread item properties
    cart.push({ ...item, id: id, quantity: 1 });
    showToast(`Added ${item.name} to cart! 🛍️`);
  }
  
  saveAndRefresh();
  return true;
}

export function updateCartQuantity(itemId, quantity) {
  const id = parseInt(itemId);
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  const item = cart.find(c => c.id === id);
  if (item) item.quantity = quantity;
  saveAndRefresh();
}

export function removeFromCart(itemId) {
  const id = parseInt(itemId);
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
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function getCart() {
  return cart;
}

// 👇 DOM FUNCTIONS (called by cartDrawer) 👇
export function renderCart() {
  const container = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  
  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty 🍕</p>';
    subtotalEl.textContent = '0.00';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #eee;">
      <div>
        <h4 style="margin: 0 0 0.25rem;">${item.name} ${item.size ? `(${item.size})` : ''}</h4>
        <p style="margin: 0; color: #28a745; font-weight: bold;">$${item.price}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity - 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px;">−</button>
        <span style="min-width: 24px; text-align: center; font-weight: bold;">${item.quantity}</span>
        <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity + 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px;">+</button>
        <button onclick="window.removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px;">×</button>
        <span style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  `).join('');
  
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
  setTimeout(() => toast.style.transform = 'translateX(0)', 10);
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
