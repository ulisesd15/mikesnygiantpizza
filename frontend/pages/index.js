// frontend/pages/index.js - MAIN ORCHESTRATOR (70 lines)
import { renderCartDrawer } from '../components/cartDrawer.js';
import { renderMenuTab, loadMenu } from '../components/menuRenderer.js';
import { renderOrdersTab } from '../components/ordersTab.js';
import { renderAdminPanel } from '../components/adminPanel.js';

let currentUser = null;
let token = null;
let menuItems = [];

export async function initApp() {
  await fetch('/api/db-sync');
  
  document.getElementById('app').innerHTML = createAppLayout();
  setupEventListeners();
  await loadMenu();  // 👈 From menuRenderer
  checkAuth();
  showTab('menu');
  updateCartCount(); // 👈 From cart
}

// 👇 MISSING HELPER FUNCTIONS 👇
function header() {
  return `
    <header class="header">
      <h1 style="color: #ff6b35; font-size: 3rem;">🍕 Mike's NY Giant Pizza</h1>
      <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px;">
        <h2>✅ PHASE 6 COMPLETE!</h2>
      </div>
    </header>
  `;
}

function authStatus() {
  return `
    <div id="auth-status" class="auth-status">
      <span id="user-info">👋 Guest - <button onclick="showAuth()" class="login-btn">Login</button></span>
      <button id="logout-btn" onclick="logout()" style="display: none;" class="logout-btn">Logout</button>
    </div>
  `;
}

function tabs() {
  return `
    <div class="tabs">
      <button onclick="showTab('menu')" class="tab-btn active">🍕 Menu</button>
      <button onclick="showTab('orders')" class="tab-btn">📋 Orders</button>
      ${currentUser?.role === 'admin' ? '<button onclick="showTab(\'admin\')" class="tab-btn">⚙️ Admin</button>' : ''}
    </div>
  `;
}

function createAppLayout() {
  return `
    <div class="app-container">
      ${header()}
      ${authStatus()}
      ${tabs()}
      <div id="menu-tab" class="tab-content">${renderMenuTab()}</div>
      <div id="orders-tab" class="tab-content" style="display: none;">${renderOrdersTab()}</div>
      ${currentUser?.role === 'admin' ? `<div id="admin-tab" class="tab-content" style="display: none;">${renderAdminPanel()}</div>` : ''}
      ${renderCartDrawer()}
    </div>
  `;
}

// 👇 MISSING EVENT HANDLERS 👇
function setupEventListeners() {
  // Menu form handler
  const menuForm = document.getElementById('menu-form');
  if (menuForm) menuForm.addEventListener('submit', addMenuItem);
}

function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
  
  document.getElementById('menu-tab').style.display = tab === 'menu' ? 'block' : 'none';
  document.getElementById('orders-tab').style.display = tab === 'orders' ? 'block' : 'none';
  document.getElementById('admin-tab')?.style.display = tab === 'admin' ? 'block' : 'none';
  
  if (tab === 'orders') window.loadOrders?.();
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const { user } = await res.json();
        currentUser = user; token = token;
        updateAuthUI();
      }
    } catch {}
  }
}

function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  if (currentUser) {
    status.innerHTML = `👋 ${currentUser.name || currentUser.email}`;
    logoutBtn.style.display = 'inline';
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  updateAuthUI();
}

// 👇 GLOBAL EXPORTS 👇
window.showTab = showTab;
window.toggleCart = window.toggleCart || (() => {}); // From cartDrawer
window.addToCart = window.addToCart || (() => {});   // From cart
window.checkout = window.checkout || (() => {});     // From cart
window.updateCartCount = window.updateCartCount || (() => {});
