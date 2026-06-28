// frontend/src/components/cart/cartStore.js

const CART_STORAGE_KEY = 'pizzaCart';

let menuItems = [];

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function setMenuItems(items) {
  menuItems = items || [];
}

export function getInitialCart() {
  return loadCart();
}

export function buildCartItem(itemOrConfig, currentCart) {
  let config;

  if (typeof itemOrConfig === 'number') {
    const item = menuItems.find((i) => i.id === itemOrConfig);
    if (!item) return currentCart;

    config = {
      menuItemId: item.id,
      name: item.name,
      size: item.size,
      basePrice: parseFloat(item.basePrice ?? item.price ?? 0),
      addedToppings: [],
      removedToppings: [],
    };
  } else {
    config = itemOrConfig || {};
  }

  const {
    menuItemId,
    name = 'Item',
    size,
    basePrice = 0,
    addedToppings = [],
    removedToppings = [],
  } = config;

  const toppingsKey = JSON.stringify({
    add: addedToppings.map((t) => t.id).sort(),
    remove: removedToppings.map((t) => t.id).sort(),
  });

  const lineId = `${menuItemId}_${size || ''}_${toppingsKey}`;
  const extra = addedToppings.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const unitPrice = Number(basePrice) + extra;

  const existing = currentCart.find((item) => item.id === lineId);

  if (existing) {
    return currentCart.map((item) =>
      item.id === lineId
        ? {
            ...item,
            quantity: item.quantity + 1,
            linePrice: unitPrice * (item.quantity + 1),
          }
        : item
    );
  }

  return [
    ...currentCart,
    {
      id: lineId,
      menuItemId,
      name,
      size,
      basePrice: Number(basePrice),
      quantity: 1,
      addedToppings,
      removedToppings,
      linePrice: unitPrice,
    },
  ];
}

export function persistCart(cart) {
  saveCart(cart);
}

export function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    if (typeof item.linePrice === 'number') return sum + item.linePrice;
    return sum + Number(item.basePrice || item.price || 0) * Number(item.quantity || 1);
  }, 0);
}

export function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 2rem; right: 2rem; background: #28a745;
    color: white; padding: 1rem 2rem; border-radius: 8px;
    z-index: 2000; transform: translateX(400px); transition: transform 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => (toast.style.transform = 'translateX(0)'), 10);
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}