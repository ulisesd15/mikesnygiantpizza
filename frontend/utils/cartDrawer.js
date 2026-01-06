// frontend/utils/cartDrawer.js
import { initGlobalFunctions, updateCartCount } from '../utils/cartStore.js';

export function renderCartDrawer() {
  return `
    <!-- CART DRAWER -->
    <div id="cart-drawer" style="position: fixed; top: 0; right: -460px; width: 400px; height: 100vh; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.3); transition: right 0.3s; z-index: 1000; padding: 2rem; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin: 0; color: #ff6b35;">🛍️ Shopping Cart</h2>
        <button onclick="window.toggleCart()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">×</button>
      </div>
      
      <div id="cart-items" style="max-height: calc(100vh - 280px); overflow-y: auto; margin-bottom: 1rem;"></div>
      
      <div id="cart-total" style="margin-top: auto; padding-top: 1.5rem; border-top: 2px solid #eee;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.2rem;">
          <strong>Subtotal:</strong>
          <strong style="color: #28a745;">$<span id="cart-subtotal">0.00</span></strong>
        </div>
        <div id="checkout-btn"></div>
      </div>
    </div>

    <!-- CART BUTTON -->
    <button 
      id="cart-toggle" 
      onclick="window.toggleCart()" 
      style="position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px; background: #ff6b35; color: white; border: none; border-radius: 50%; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,53,0.4); z-index: 999; transition: all 0.3s;"
    >
      🛍️
      <span 
        id="cart-count" 
        style="position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; font-weight: bold;"
      >0</span>
    </button>

    <!-- OVERLAY -->
    <div 
      id="cart-overlay" 
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; display: none; backdrop-filter: blur(2px);" 
      onclick="window.toggleCart()"
    ></div>
  `;
}

// Toggle cart drawer
export function toggleCart() {
  console.log('🛍️ toggleCart() called');
  
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const cartBtn = document.getElementById('cart-toggle');
  
  if (!drawer || !cartBtn) {
    console.error('❌ Cart elements missing!');
    return;
  }
  
  const isOpen = drawer.style.right === '0px';
  
  if (isOpen) {
    // Close drawer
    drawer.style.right = '-460px';
    overlay.style.display = 'none';
    cartBtn.style.background = '#ff6b35';
  } else {
    // Open drawer
    drawer.style.right = '0px';
    overlay.style.display = 'block';
    cartBtn.style.background = '#28a745';
    
    // Refresh cart contents
    if (window.renderCart) {
      window.renderCart();
    }
    
    // Update checkout button
    updateCheckoutButton();
  }
}

// Update checkout button based on cart state
function updateCheckoutButton() {
  const checkoutContainer = document.getElementById('checkout-btn');
  if (!checkoutContainer) return;
  
  const cartCount = window.getCartCount?.() || 0;
  
  if (cartCount === 0) {
    checkoutContainer.innerHTML = `
      <button 
        disabled
        style="width: 100%; padding: 1rem; background: #ccc; color: #666; border: none; border-radius: 8px; font-size: 1rem; cursor: not-allowed;"
      >
        Cart is Empty
      </button>
    `;
  } else {
    checkoutContainer.innerHTML = `
      <button 
        onclick="window.goToCheckout()" 
        style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);"
      >
        🛒 Proceed to Checkout
      </button>
    `;
  }
}

// Initialize after DOM loads
export function initCartDrawer() {
  console.log('🔧 Initializing cart drawer...');
  
  window.toggleCart = toggleCart;
  
  initGlobalFunctions();
  updateCartCount();
  updateCheckoutButton();
  
  console.log('✅ Cart drawer initialized');
}
