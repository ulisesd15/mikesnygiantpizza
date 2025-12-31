// frontend/pages/index.js - MAIN ORCHESTRATOR (COMPLETE)
import { renderCartDrawer } from '../components/cartDrawer.js';
import { renderMenuTab, loadMenu, initMenuGlobalFunctions } from '../components/menuRenderer.js';
import { renderOrdersTab } from '../components/ordersTab.js';
import { renderAdminPanel } from '../components/adminPanel.js';
import { initGlobalFunctions, updateCartCount } from '../utils/cartStore.js';

let currentUser = null;
let token = null;
let menuItems = [];

export async function initApp() {
  await fetch('/api/db-sync');
  
  document.getElementById('app').innerHTML = createAppLayout();
  
  // 👈 INITIALIZE ALL GLOBALS FIRST
  initGlobalFunctions();        // cartStore globals
  initMenuGlobalFunctions();    // menu globals
  setupEventListeners();
  
  // 👈 LOAD DATA
  menuItems = await loadMenu(); // From menuRenderer
  updateCartCount();            // Cart badge
  checkAuth();
  showTab('menu');
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
    <style>${globalStyles()}</style>
  `;
}

// 👇 UI COMPONENTS 👇
function header() {
  return `
    <header style="text-align: center; margin-bottom: 3rem;">
      <h1 style="color: #ff6b35; font-size: 3rem; margin: 0;">🍕 Mike's NY Giant Pizza</h1>
      <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px; margin-top: 1rem;">
        <h2>✅ PHASE 6 COMPLETE!</h2>
      </div>
    </header>
  `;
}

function authStatus() {
  return `
    <div id="auth-status" style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
      <span id="user-info">👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login</button></span>
      <button id="logout-btn" onclick="logout()" style="display: none; background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 1rem;">Logout</button>
    </div>
  `;
}

function tabs() {
  return `
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; flex-wrap: wrap;">
      <button onclick="showTab('menu')" class="tab-btn active">🍕 Public Menu</button>
      <button onclick="showTab('orders')" class="tab-btn">📋 My Orders</button>
      ${currentUser?.role === 'admin' ? '<button onclick="showTab(\'admin\')" class="tab-btn">⚙️ Admin Panel</button>' : ''}
    </div>
  `;
}

// 👇 EVENT HANDLERS 👇
function setupEventListeners() {
  const menuForm = document.getElementById('menu-form');
  if (menuForm) menuForm.addEventListener('submit', window.addMenuItem || addMenuItem);
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
  token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch('/api/auth/profile', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const { user } = await res.json();
        currentUser = user;
        updateAuthUI();
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
  }
}

function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  if (currentUser && status && logoutBtn) {
    status.innerHTML = `👋 ${currentUser.name || currentUser.email} (${currentUser.role})`;
    logoutBtn.style.display = 'inline-block';
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  token = null;
  updateAuthUI();
}

function showAuth() {
  // TODO: Auth modal (Phase 7)
  alert('Login/Register modal - Phase 7!');
}

function addMenuItem(e) {
  // Fallback for admin form (move to adminPanel.js)
  alert('Admin form handler - Phase 7!');
}

function globalStyles() {
  return `
    .tab-btn { padding: 1rem 2rem; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
    .tab-btn.active { background: #ff6b35; color: white; }
    .tab-content { animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .menu-card { border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .menu-card:hover { transform: translateY(-4px); transition: transform 0.2s; }
  `;
}

// 👇 NO TOP-LEVEL EXECUTION 👇
// All code runs inside initApp() only!
