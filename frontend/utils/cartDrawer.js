// frontend/cartDrawer.js - JUST HTML + toggle (uses cartStore.js logic)
import { initGlobalFunctions, updateCartCount } from '../utils/cartStore.js';

// frontend/components/cartDrawer.js
export function renderCartDrawer() {
  return `
    <!-- CART DRAWER (NO WRAPPER!) -->
    <div id="cart-drawer" style="position: fixed; top: 0; right: -460px; width: 400px; height: 100vh; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.3); transition: right 0.3s; z-index: 1000; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin: 0; color: #ff6b35;">🛒 Shopping Cart</h2>
        <button onclick="window.toggleCart()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
      </div>
      <div id="cart-items" style="max-height: 60vh; overflow-y: auto;"></div>
      <div id="cart-total" style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #eee;">
        <h3 style="margin: 0 0 1rem;">Total: $<span id="cart-subtotal">0.00</span></h3>
        <button id="checkout-btn" class="button-primary" style="width: 100%;" onclick="window.checkout()">🚀 Checkout</button>
      </div>
    </div>

    <!-- CART BUTTON -->
    <button id="cart-toggle" onclick="window.toggleCart()" style="position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px; background: #ff6b35; color: white; border: none; border-radius: 50%; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,53,0.4); z-index: 999;">
      🛒<span id="cart-count" style="position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">0</span>
    </button>

    <!-- OVERLAY -->
    <div id="cart-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; display: none;" onclick="window.toggleCart()"></div>
  `;
}



//toggles cart
export function toggleCart() {
  console.log('🛒 toggleCart() EXECUTED!');
  
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const cartBtn = document.getElementById('cart-toggle');  // 👈 MISSING!
  
  if (!drawer || !cartBtn) {
    console.error('❌ Cart elements missing!');
    return;
  }
  
  
  if (drawer.style.right === '0px' || drawer.style.right === '') {
    
    drawer.style.right = '-440px';
    overlay.style.display = 'none';
    cartBtn.style.background = '#ff6b35';  // Orange (closed)
  } else {
    
    drawer.style.right = '0px';
    overlay.style.display = 'block';
    cartBtn.style.background = '#28a745';  // Green (open)
    if (window.renderCart) window.renderCart();  // Refresh cart
  }
}



// Initialize after DOM loads
export function initCartDrawer() {
  window.toggleCart = toggleCart; // From cartDrawer.js

  initGlobalFunctions();  // From cartStore.js
  updateCartCount();      // From cartStore.js
}
