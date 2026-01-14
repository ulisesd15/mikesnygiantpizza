// main.js - Updated with Google OAuth and Checkout Integration
import { renderCartDrawer, initCartDrawer } from './utils/cartDrawer.js';
import { initGlobalFunctions } from './utils/cartStore.js';
import { renderMenuTab, loadMenu, initMenuGlobalFunctions } from './components/menuRenderer.jsx';
import { renderAdminTab, initAdminPanel, loadAdminMenu } from './components/adminPanel.jsx';
import { renderOrdersTab, initOrdersTab } from './components/ordersTab.jsx';
import { renderCheckoutPage, initCheckout } from './components/checkout/CheckoutPage.jsx';
import { renderOrderConfirmation, initOrderConfirmation } from './components/orders/OrderConfirmation.jsx';
import { checkAuth, updateAuthUI } from './auth.jsx'; 





document.title = 'Mike\'s NY Giant Pizza - Online Ordering';

let currentOrder = null; // Store current order for confirmation page

// Helper to toggle admin button visibility


// 🔧 DEFINE showTab BEFORE loadApp()
window.showTab = (tab) => {
  console.log('📑 Switching to tab:', tab);
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[onclick="showTab('${tab}')"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Hide all tabs
  ['menu-tab', 'orders-tab', 'admin-tab', 'checkout-tab', 'confirmation-tab'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  
  if (tab === 'menu') {
    const menuTab = document.getElementById('menu-tab');
    if (menuTab) {
      menuTab.style.display = 'block';
      console.log('✅ Menu tab now visible');
    }
  }
  
  if (tab === 'orders') {
    const ordersTab = document.getElementById('orders-tab');
    if (ordersTab) {
      ordersTab.style.display = 'block';
      initOrdersTab(); // ✅ Changed from loadOrders()
    }
  }
  
  if (tab === 'admin') {
    const adminTab = document.getElementById('admin-tab');
    if (adminTab) {
      adminTab.style.display = 'block';
      // ✅ Initialize admin panel properly
      initAdminPanel();
    }
  }
  
  if (tab === 'checkout') {
    const checkoutTab = document.getElementById('checkout-tab');
    if (checkoutTab) {
      checkoutTab.style.display = 'block';
      checkoutTab.innerHTML = renderCheckoutPage();
      initCheckout();
    }
  }
  
  if (tab === 'confirmation') {
    const confirmationTab = document.getElementById('confirmation-tab');
    if (confirmationTab) {
      confirmationTab.style.display = 'block';
      confirmationTab.innerHTML = renderOrderConfirmation(currentOrder);
      initOrderConfirmation();
    }
  }
};

// Global function to navigate to checkout
window.goToCheckout = () => {
  console.log('🛒 Navigating to checkout...');
  window.toggleCart?.(); // Close cart drawer
  showTab('checkout');
};

// Global function to show order confirmation
window.showOrderConfirmation = (order) => {
  console.log('✅ Showing order confirmation...', order);
  currentOrder = order;
  showTab('confirmation');
};

function mainUI() {
  return `
    <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
      <header style="text-align: center; margin-bottom: 3rem;">
        <h1 style="color: #ff6b35; font-size: 3rem; margin: 0; cursor: pointer;" onclick="showTab('menu')">🍕 Mike's NY Giant Pizza</h1>
        <p style="color: #666; margin: 0.5rem 0 0; font-size: 1.1rem;">Authentic New York Style Pizza</p>
      </header>

      <!-- Auth Status -->
      <div id="auth-status" style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <span id="user-info">👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button></span>
        <button id="logout-btn" onclick="logout()" style="display: none; background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 1rem;">Logout</button>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; flex-wrap: wrap;" id="tabs">
        <button onclick="showTab('menu')" class="tab-btn active">🍕 Menu</button>
        <button onclick="showTab('orders')" class="tab-btn">📋 My Orders</button>
        <button id="admin-tab-btn" onclick="showTab('admin')" class="tab-btn" style="display: none;">⚙️ Admin</button>
      </div>

      <!-- Tab Content -->
      <div id="menu-tab" style="display: block;">${renderMenuTab()}</div>
      <div id="checkout-tab" style="display: none;"></div>
      <div id="confirmation-tab" style="display: none;"></div>
      ${renderOrdersTab()}
      ${renderAdminTab()}

      <!-- Cart -->
      ${renderCartDrawer()}

      <!-- Auth Modal -->
      <div id="auth-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; backdrop-filter: blur(2px);">
        <div style="background: white; margin: 10% auto; padding: 2rem; border-radius: 12px; max-width: 400px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <button onclick="hideAuth()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">×</button>
          
          <div id="auth-form" style="text-align: center;">
            <h3 style="color: #333; margin: 0 0 1.5rem; font-size: 1.5rem;">👋 Welcome Back</h3>
            
            <!-- Email & Password Login -->
            <input id="auth-email" type="email" placeholder="Email" class="input-style" style="margin-bottom: 1rem;">
            <input id="auth-password" type="password" placeholder="Password" class="input-style" style="margin-bottom: 1rem;">
            <button onclick="handleAuthSubmit()" style="background: #28a745; color: white; border: none; padding: 0.875rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; font-weight: 500; margin-bottom: 0.75rem;">🚀 Login</button>
            <button onclick="handleAuthSubmit(true)" style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; border: none; padding: 0.875rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; font-weight: 500; margin-bottom: 1rem;">➕ Create Account</button>
            
            <!-- Divider -->
            <div style="text-align: center; margin: 1.5rem 0; position: relative;">
              <div style="border-top: 1px solid #ddd;"></div>
              <span style="background: white; padding: 0 0.5rem; color: #999; position: relative; top: -10px; font-size: 0.9rem;">or</span>
            </div>
            
            <!-- Google Sign-In -->
            <div id="google-signin" style="margin-bottom: 1rem;"></div>
            
            <p style="margin-top: 1.5rem; color: #666; font-size: 0.9rem;">
              Need help? <a href="#" onclick="showForgotPassword(); return false;" style="color: #007bff; text-decoration: none;">Forgot password?</a>
            </p>
          </div>
        </div>
      </div>

      <!-- STYLES -->
      <style>
        .tab-btn { 
          padding: 1rem 2rem; 
          background: #f8f9fa; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 1rem; 
          transition: all 0.3s; 
          font-weight: 500;
        }
        .tab-btn.active, .tab-btn:hover { 
          background: #ff6b35; 
          color: white; 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        .tab-content { 
          animation: fadeIn 0.3s; 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .input-style { 
          width: 100%; 
          padding: 0.75rem; 
          margin-bottom: 1rem; 
          border: 1px solid #ddd; 
          border-radius: 6px; 
          box-sizing: border-box; 
          font-size: 1rem; 
        }
        .input-style:focus { 
          outline: none; 
          border-color: #ff6b35; 
          box-shadow: 0 0 0 3px rgba(255,107,53,0.1); 
        }
        .menu-card { 
          border: 1px solid #ddd; 
          border-radius: 12px; 
          padding: 1.5rem; 
          background: white; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          transition: transform 0.2s; 
        }
        .menu-card:hover { 
          transform: translateY(-4px); 
        }
        .size-selector { 
          width: 100%; 
          padding: 0.75rem; 
          border: 2px solid #ff6b35; 
          border-radius: 8px; 
          background: white; 
          font-size: 1rem; 
          font-weight: 500; 
        }
        .add-to-cart-btn { 
          transition: background 0.3s; 
          width: 100%; 
          background: #ff6b35; 
          color: white; 
          border: none; 
          padding: 1rem; 
          border-radius: 8px; 
          font-size: 1.1rem; 
          cursor: pointer; 
        }
        .add-to-cart-btn:hover { 
          background: #e55a2b !important; 
          transform: translateY(-2px); 
        }
      </style>
    </div>
  `;
}

// 🔧 LOAD GOOGLE SIGN-IN
function loadGoogleSignIn() {
  // Load Google API script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log('🔐 Google Sign-In library loaded');
    
    // Initialize Google Sign-In
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: async (response) => {
        console.log('✅ Google response received');
        // Call the auth handler from auth.js
        if (window.handleGoogleAuth) {
          await window.handleGoogleAuth(response.credential);
        }
      },
      error_callback: () => {
        console.error('❌ Google Sign-In error');
      }
    });
    
    // Render the button
    const googleSignInDiv = document.getElementById('google-signin');
    if (googleSignInDiv && google.accounts.id) {
      google.accounts.id.renderButton(
        googleSignInDiv,
        { 
          theme: 'outline', 
          size: 'large',
          width: '100%',
          text: 'signin_with'
        }
      );
      console.log('✅ Google Sign-In button rendered');
    }
  };
  document.head.appendChild(script);
}

async function loadApp() {
  console.log('🚀 Starting app load...');
  
  // 1. Render HTML FIRST
  document.getElementById('app').innerHTML = mainUI();
  console.log('✅ HTML rendered');
  
  // 2. Load Google Sign-In
  loadGoogleSignIn();
  
  // 3. Initialize global functions
  initMenuGlobalFunctions();
  initCartDrawer();
  initGlobalFunctions();
  console.log('✅ Global functions initialized');
  
  // 4. Load menu data
  console.log('🔄 Loading menu...');
  await loadMenu();
  console.log('✅ Menu loaded');
  
  // 5. Check authentication SAFELY
  try {
    if (typeof checkAuth === 'function') {
      console.log('🔍 checkAuth available');
      await checkAuth();
    } else {
      console.warn('❌ checkAuth not imported - skipping');
    }
    await updateAuthUI();
  } catch (error) {
    console.warn('⚠️ Auth check failed:', error.message);
  }
  console.log('🔍 AFTER AUTH - window.currentUser:', window.currentUser);

  
  
  // 6. Update cart drawer
  updateCartDrawerWithCheckout();
  
  console.log('✅ App fully loaded!');
}

// Add checkout button to cart drawer
function updateCartDrawerWithCheckout() {
  const checkoutContainer = document.getElementById('checkout-btn');
  if (checkoutContainer) {
    checkoutContainer.innerHTML = `
      <button 
        onclick="window.goToCheckout()" 
        style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; margin-top: 1rem;"
      >
        🛒 Proceed to Checkout
      </button>
    `;
  }
}

// Start the app
loadApp().catch(error => {
  console.error('❌ App failed to load:', error);
  document.getElementById('app').innerHTML = `
    <div style="text-align: center; padding: 3rem; color: #dc3545;">
      <h2>Failed to load application</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">Reload Page</button>
    </div>
  `;
});
