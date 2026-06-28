// main.jsx
import { renderCartDrawer, initCartDrawer } from './src/components/cart/cartDrawer.jsx';
import { renderMenuTab, loadMenu, initMenuGlobalFunctions } from './src/components/menuRenderer.jsx';
import { renderAdminTab, initAdminPanel } from './src/components/admin/adminPanel.jsx';
import { renderOrdersTab, initOrdersTab } from './src/components/orders/ordersTab.jsx';
import { renderCheckoutPage, initCheckout } from './src/components/checkout/CheckoutPage.jsx';
import { renderOrderConfirmation, initOrderConfirmation } from './src/components/orders/OrderConfirmation.jsx';

import { checkAuth, updateAuthUI } from './auth.jsx';

document.title = "Mike's NY Giant Pizza - Online Ordering";

let currentOrder = null;

// Define showTab before loadApp()
window.showTab = (tab) => {
  console.log('📑 Switching to tab:', tab);

  document.documentElement.dataset.activeTab = tab;

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`[onclick="showTab('${tab}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Hide all tabs
  ['menu-tab', 'orders-tab', 'admin-tab', 'checkout-tab', 'confirmation-tab'].forEach((id) => {
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
      initOrdersTab();
    }
  }

  if (tab === 'admin') {
    const adminTab = document.getElementById('admin-tab');
    if (adminTab) {
      adminTab.style.display = 'block';
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

// Navigate to checkout
window.goToCheckout = () => {
  console.log('🛒 Navigating to checkout...');
  window.toggleCart?.();
  window.showTab('checkout');
};

// Show order confirmation
window.showOrderConfirmation = (order) => {
  console.log('✅ Showing order confirmation...', order);
  currentOrder = order;
  window.showTab('confirmation');
};

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = savedTheme;

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

window.toggleTheme = () => {
  const currentTheme = document.documentElement.dataset.theme || 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('theme', nextTheme);

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = nextTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
};

function mainUI() {
  return `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header-row">
          <div class="brand-lockup" onclick="showTab('menu')">
            <h1 class="brand-title">Mike's <span>NY Giant Pizza</span></h1>
            <p class="brand-subtitle">Modern ordering. New York flavor. Italian roots.</p>
          </div>

          <button class="theme-toggle" onclick="window.toggleTheme()">
            🌙 Dark Mode
          </button>
        </div>
      </header>

      <!-- Auth Status -->
      <div id="auth-status" class="auth-status">
        <span id="user-info">
          👋 Guest -
          <button
            onclick="showAuth()"
            style="background:#007bff;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;"
          >
            Login/Register
          </button>
        </span>

        <button
          id="logout-btn"
          onclick="logout()"
          style="display:none;background:#dc3545;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;margin-left:1rem;"
        >
          Logout
        </button>
      </div>

      <!-- Tabs -->
      <div class="app-tabs" id="tabs">
        <button onclick="showTab('menu')" class="tab-btn active">🍕 Menu</button>
        <button onclick="showTab('orders')" class="tab-btn">📋 My Orders</button>
        <button id="admin-tab-btn" onclick="showTab('admin')" class="tab-btn" style="display:none;">⚙️ Admin</button>
      </div>

      <!-- Tab Content -->
      <div id="menu-tab" style="display:block;">${renderMenuTab()}</div>
      <div id="checkout-tab" style="display:none;"></div>
      <div id="confirmation-tab" style="display:none;"></div>
      ${renderOrdersTab()}
      ${renderAdminTab()}

      <!-- Cart -->
      ${renderCartDrawer()}

      <!-- Auth Modal -->
      <div id="auth-modal" class="modal-backdrop" style="display:none;">
        <div class="auth-modal-card">
          <button onclick="hideAuth()" class="modal-close-btn" aria-label="Close login modal">
            ×
          </button>

          <div id="auth-form" style="text-align:center;">
            <h3 class="auth-modal-title">Welcome Back</h3>

            <p style="margin-top:-0.75rem;margin-bottom:1.25rem;color:var(--color-muted);font-size:0.92rem;">
              Login or create an account to track your orders.
            </p>

            <input
              id="auth-name"
              type="text"
              placeholder="Full Name - only needed for new accounts"
              class="input-style"
              style="margin-bottom:1rem;"
            >

            <input
              id="auth-email"
              type="email"
              placeholder="Email"
              class="input-style"
              style="margin-bottom:1rem;"
            >

            <div style="position:relative;margin-bottom:1rem;">
              <input
                id="auth-password"
                type="password"
                placeholder="Password"
                class="input-style"
                style="padding-right:3rem;margin-bottom:0;"
              >

              <button
                type="button"
                id="toggle-password"
                onclick="togglePasswordVisibility()"
                class="password-toggle-btn"
                aria-label="Toggle password visibility"
              >
                <span id="eye-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </span>
              </button>
            </div>

            <button
              onclick="handleAuthSubmit(false)"
              class="app-btn app-btn-primary"
              style="width:100%;padding:0.875rem;margin-bottom:0.75rem;"
            >
              Login
            </button>

            <button
              onclick="handleAuthSubmit(true)"
              class="app-btn app-btn-secondary"
              style="width:100%;padding:0.875rem;margin-bottom:0.75rem;"
            >
              Create Account
            </button>

            <div class="auth-divider">
              <div></div>
              <span>or</span>
            </div>

            <div id="google-signin" style="margin-bottom:1rem;"></div>

            <p style="margin-top:1.5rem;color:var(--color-muted);font-size:0.9rem;">
              Need help?
              <a
                href="#"
                onclick="showForgotPassword(); return false;"
                style="color:var(--color-primary);text-decoration:none;font-weight:700;"
              >
                Forgot password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Password toggle functionality
window.togglePasswordVisibility = () => {
  const passwordInput = document.getElementById('auth-password');
  const eyeIcon = document.getElementById('eye-icon');
  const toggleBtn = document.getElementById('toggle-password');

  if (!passwordInput || !eyeIcon || !toggleBtn) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.style.background = '#f0f0f0';
  } else {
    passwordInput.type = 'password';
    toggleBtn.style.background = 'none';
  }
};

// Load Google Sign-In
function loadGoogleSignIn() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('⚠️ Missing VITE_GOOGLE_CLIENT_ID. Google Sign-In will not load.');
    return;
  }

  if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
    console.log('ℹ️ Google Sign-In script already loaded');
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    console.log('🔐 Google Sign-In library loaded');

    if (!window.google?.accounts?.id) {
      console.warn('⚠️ Google Sign-In library unavailable');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        console.log('✅ Google response received');

        if (window.handleGoogleAuth) {
          await window.handleGoogleAuth(response.credential);
        }
      },
      error_callback: () => {
        console.error('❌ Google Sign-In error');
      }
    });

    const googleSignInDiv = document.getElementById('google-signin');

    if (googleSignInDiv && window.google.accounts.id) {
      window.google.accounts.id.renderButton(
        googleSignInDiv,
        {
          theme: 'outline',
          size: 'large',
          width: 320,
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

  const appEl = document.getElementById('root');

  if (!appEl) {
    throw new Error('Missing #root container in index.html');
  }

  appEl.innerHTML = mainUI();
  applySavedTheme();

  console.log('✅ HTML rendered');

  loadGoogleSignIn();
  initCartDrawer();
  initMenuGlobalFunctions();

  await loadMenu();

  try {
    if (typeof checkAuth === 'function') {
      await checkAuth();
    }

    await updateAuthUI();
  } catch (error) {
    console.warn('⚠️ Auth check failed:', error.message);
  }
}

// Start the app
loadApp().catch((error) => {
  console.error('❌ App failed to load:', error);

  const root = document.getElementById('root');

  if (root) {
    root.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#dc3545;">
        <h2>Failed to load application</h2>
        <p>${error.message}</p>
        <button
          onclick="location.reload()"
          style="background:#007bff;color:white;border:none;padding:0.75rem 1.5rem;border-radius:6px;cursor:pointer;margin-top:1rem;"
        >
          Reload Page
        </button>
      </div>
    `;
  }
});