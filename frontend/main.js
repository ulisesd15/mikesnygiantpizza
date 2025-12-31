// main.js - FIXED import (no handleAuthSubmit needed)
import { renderCartDrawer, initCartDrawer } from './utils/cartDrawer.js';
import { renderMenuTab, loadMenu, initMenuGlobalFunctions } from './components/menuRenderer.js';
import { renderAdminTab, addMenuItem } from './components/adminPanel.js';
import { renderOrdersTab, loadOrders } from './components/ordersTab.js';  
import { checkAuth, updateAuthUI } from './auth.js'; 

document.title = 'Mike\'s NY Giant Pizza - Stage 4 Menu';

function mainUI() {
  return `
    <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
      <header style="text-align: center; margin-bottom: 3rem;">
        <h1 style="color: #ff6b35; font-size: 3rem; margin: 0;">🍕 Mike's NY Giant Pizza</h1>
        <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px; margin-top: 1rem;">
          <h2>✅ STAGE 4: Menu Management Complete!</h2>
          <p>Admin CRUD | Public menu | JWT protected</p>
        </div>
      </header>

      <!-- Auth Status -->
      <div id="auth-status" style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <span id="user-info">👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button></span>
        <button id="logout-btn" onclick="logout()" style="display: none; background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 1rem;">Logout</button>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; flex-wrap: wrap;" id="tabs">
        <button onclick="showTab('menu')" class="tab-btn active">🍕 Public Menu</button>
        <button onclick="showTab('orders')" class="tab-btn">📋 My Orders</button>
      </div>

      <!-- DYNAMIC TABS -->
      <div id="menu-tab" style="display: block;">${renderMenuTab()}</div>
      ${renderOrdersTab()}
      ${renderAdminTab()}

      <!-- Cart -->
      ${renderCartDrawer()}

      <!-- ✅ COMPLETE AUTH MODAL -->
      <div id="auth-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; backdrop-filter: blur(2px);">
        <div style="background: white; margin: 10% auto; padding: 2rem; border-radius: 12px; max-width: 400px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <button onclick="hideAuth()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">×</button>
          
          <div id="auth-form" style="text-align: center;">
            <h3 style="color: #333; margin: 0 0 1.5rem; font-size: 1.5rem;">👋 Welcome Back</h3>
            <input id="auth-email" type="email" placeholder="Email" class="input-style" style="margin-bottom: 1rem;">
            <input id="auth-password" type="password" placeholder="Password" class="input-style" style="margin-bottom: 1rem;">
            <button onclick="handleAuthSubmit()" style="background: #28a745; color: white; border: none; padding: 0.875rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; font-weight: 500; margin-bottom: 0.75rem;">🚀 Login</button>
            <button onclick="handleAuthSubmit(true)" style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; border: none; padding: 0.875rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; font-weight: 500;">➕ Create Account</button>
            <p style="margin-top: 1.5rem; color: #666; font-size: 0.9rem;">
              Need help? <a href="#" onclick="showForgotPassword(); return false;" style="color: #007bff; text-decoration: none;">Forgot password?</a>
            </p>
          </div>
        </div>
      </div>

      <!-- STYLES -->
      <style>
        .tab-btn { padding: 1rem 2rem; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.3s; }
        .tab-btn.active, .tab-btn:hover { background: #ff6b35; color: white; }
        .tab-content, #menu-tab { animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .input-style { 
          width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ddd; 
          border-radius: 6px; box-sizing: border-box; font-size: 1rem; 
        }
        .input-style:focus { outline: none; border-color: #ff6b35; box-shadow: 0 0 0 3px rgba(255,107,53,0.1); }
        .menu-card { border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .menu-card:hover { transform: translateY(-4px); }
        .size-selector { width: 100%; padding: 0.75rem; border: 2px solid #ff6b35; border-radius: 8px; background: white; font-size: 1rem; font-weight: 500; }
        .add-to-cart-btn { transition: background 0.3s; width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; }
        .add-to-cart-btn:hover { background: #e55a2b !important; transform: translateY(-2px); }
      </style>
    </div>
  `;
}

async function loadApp() {
  await fetch('/api/db-sync');
  document.getElementById('app').innerHTML = mainUI();
  
  // 🔥 ONE LINE: Initialize ALL modules
  await Promise.all([
    initCartDrawer(),
    loadMenu(),
    checkAuth(),
    initMenuGlobalFunctions()
  ]);
  
  window.showTab('menu');
}

// ✅ GLOBAL TAB SWITCHER (ONLY global function needed)
window.showTab = (tab) => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
  
  // Hide all tabs
  document.getElementById('menu-tab').style.display = 'none';
  document.getElementById('orders-tab').style.display = 'none';
  document.getElementById('admin-tab').style.display = 'none';
  
  // Show selected + load data
  if (tab === 'menu') document.getElementById('menu-tab').style.display = 'block';
  if (tab === 'orders') {
    document.getElementById('orders-tab').style.display = 'block';
    loadOrders();
  }
  if (tab === 'admin') document.getElementById('admin-tab').style.display = 'block';
};

// Auth globals (from auth.js)
window.showAuth = () => document.getElementById('auth-modal').style.display = 'block';
window.hideAuth = () => document.getElementById('auth-modal').style.display = 'none';
window.logout = () => {
  localStorage.removeItem('token');
  window.currentUser = null;
  updateAuthUI();
};
window.showForgotPassword = () => showToast('Contact Mike for password reset! 📞', 'info');

loadApp().catch(console.error);
