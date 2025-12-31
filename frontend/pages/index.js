// frontend/pages/index.js
import { renderCartDrawer } from '../components/cartDrawer.js';
import { renderMenuTab } from '../components/menuRenderer.js';
import { renderOrdersTab } from '../components/ordersTab.js';
import { renderAdminPanel } from '../components/adminPanel.js';

let currentUser = null;
let menuItems = [];

export async function initApp() {
  await fetch('/api/db-sync');
  
  document.getElementById('app').innerHTML = createAppLayout();
  setupEventListeners();
  await loadMenu();
  checkAuth();
  showTab('menu');
  updateCartBadge();
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

// Export global functions for onclick handlers
window.showTab = showTab;
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.checkout = checkout;
