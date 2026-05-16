// ordersTab.jsx

//VIEW SHELL
//Renders the base tab container and the initial “Loading orders...” placeholder.
export function renderOrdersTab() {
  return `
    <div id="orders-tab" class="tab-content" style="display: none;">
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #f0f8ff, #e6f7ff); border-radius: 12px; margin-bottom: 2rem; border: 2px solid #007bff;">
        <h2 style="color: #007bff; margin: 0 0 0.5rem;">📋 My Order History</h2>
        <p style="color: #666; margin: 0;">Track your delicious pizza orders</p>
      </div>
      <div id="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 3rem; color: #666;">Loading orders... 🍕</div>
      </div>
    </div>
  `;
}
//Renders the order list into #orders-grid.
export function renderOrders(orders) {
  const container = document.getElementById('orders-grid');
  if (!container) return;
  
  if (!orders || orders.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">No orders found 🍕</div>';
    return;
  }
  
  container.innerHTML = orders.map(order => orderCard(order)).join('');
}
//Builds one order card’s HTML and normalizes incoming order data for display.
export function orderCard(order) {
  // ✅ Transform localStorage data to match expected format
  const safeOrder = {
    id: order.id || '',
    orderNumber: order.orderNumber || `ORD-${Date.now()}`,
    userId: order.userId || '',
    customerName: order.customerName || 'Customer',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    orderType: order.orderType || 'pickup',
    deliveryAddress: order.deliveryAddress || '',
    status: order.status || 'completed',
    total: parseFloat(order.total) || 0,
    createdAt: order.createdAt || new Date().toISOString(),
    items: (order.items || order.orderItems || []).map(item => ({
      name: item.name || 'Pizza',
      size: item.size || '',
      price: parseFloat(item.price) || 0,
      quantity: item.quantity || 1
    }))
  };
  
  const statusColors = {
    pending: { bg: '#fff3cd', border: '#ffc107', text: '#856404', emoji: '⏳' },
    preparing: { bg: '#cfe2ff', border: '#0d6efd', text: '#084298', emoji: '👨‍🍳' },
    ready: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '✅' },
    delivered: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '🚚' },
    completed: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '✅' }
  };
  
  const statusInfo = statusColors[safeOrder.status] || statusColors.completed;
  const orderDate = new Date(safeOrder.createdAt);
  const formattedDate = orderDate.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  
  return `
    <div class="menu-card" style="border-left: 5px solid ${statusInfo.border}; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h3 style="margin: 0; color: #333; font-size: 1.2rem;">Order #${safeOrder.orderNumber}</h3>
          <p style="color: #999; margin: 0.25rem 0 0; font-size: 0.85rem;">${formattedDate}</p>
        </div>
        <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem; border: 2px solid ${statusInfo.border};">
          ${statusInfo.emoji} ${safeOrder.status.toUpperCase()}
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="font-weight: 600; color: #666; font-size: 0.9rem;">
          ${safeOrder.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
        </div>
        ${safeOrder.orderType === 'delivery' && safeOrder.deliveryAddress ? `<div style="font-size: 0.85rem; color: #999; margin-top: 0.25rem;">${safeOrder.deliveryAddress}</div>` : ''}
      </div>
      
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #666;">Order Items:</h4>
        ${safeOrder.items.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
              <span style="font-weight: 600;">🍕 ${item.name}</span>
              ${item.size ? `<span style="color: #666; font-size: 0.85rem;"> (${item.size})</span>` : ''}
              <span style="color: #999; font-size: 0.85rem;"> x${item.quantity}</span>
            </div>
            <span style="font-weight: 600; color: #28a745;">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('') || '<p style="color: #999; font-style: italic;">No items</p>'}
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid ${statusInfo.border};">
        <span style="font-weight: 600; font-size: 1.1rem; color: #333;">Total:</span>
        <span style="font-weight: bold; font-size: 1.3rem; color: #28a745;">$${safeOrder.total.toFixed(2)}</span>
      </div>
      
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.85rem; color: #999;">
        <div>👤 ${safeOrder.customerName}</div>
        <div>📧 ${safeOrder.customerEmail}</div>
      </div>
    </div>
  `;
}

//DATA ACCESS
//Reads pizzaOrders from localStorage and filters orders for the current user.
function getUserOrders(userId) {
  try {
    const ordersData = localStorage.getItem('pizzaOrders');
    if (!ordersData) return [];
    
    const allOrders = JSON.parse(ordersData) || [];
    console.log('🔍 Raw orders data:', allOrders); // DEBUG
    
    // ✅ FIXED: Handle both string/number userId and proper filtering
    const userOrders = allOrders.filter(order => 
      order.userId == userId ||  // Loose equality for string/number
      order.userId === parseInt(userId)  // Strict numeric match
    );
    
    console.log(`✅ Filtered ${userOrders.length} orders for userId: ${userId}`);
    return userOrders;
  } catch (error) {
    console.error('❌ Error parsing orders:', error);
    return [];
  }
}
//Calls the backend /orders/my-orders endpoint using the auth token.
async function fetchUserOrders() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  
  const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/api';
  
  const response = await fetch(`${apiBase}/orders/my-orders`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  
  const data = await response.json();
  return data.orders || data.data?.orders || [];
}

//INTERACTION WIRING
//Connect UI elements to actions.
function attachEventListeners(container) {
  // ✅ FIXED: Event delegation instead of inline onclick
  container.querySelector('[data-action="showAuth"]')?.addEventListener('click', () => {
    if (typeof window.showAuth === 'function') window.showAuth();
  });
  
  container.querySelector('[data-action="showMenu"]')?.addEventListener('click', () => {
    if (typeof window.showTab === 'function') window.showTab('menu');
  });
  
  container.querySelector('[data-action="retry"]')?.addEventListener('click', loadOrders);
}

//STARTUP
export async function loadOrders() {
  console.log('📋 Loading user orders...');
  
  const ordersGrid = document.getElementById('orders-grid');
  if (!ordersGrid) {
    console.warn('⚠️ Orders grid not found');
    return;
  }
  
  // Check if user is logged in
  if (!window.currentUser?.id) {
    ordersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff3cd; border-radius: 12px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin: 0 0 1rem;">🔒 Login Required</h3>
        <p style="color: #856404; margin: 0 0 1.5rem;">Please login to view your order history</p>
        <button data-action="showAuth" style="background: #007bff; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;">
          🔑 Login / Register
        </button>
      </div>
    `;
    attachEventListeners(ordersGrid);
    return;
  }

  // Show loading
  ordersGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🍕</div>
      <p>Loading your orders...</p>
    </div>
  `;

  try {
    // Try API first, fallback to localStorage
    const apiOrders = await fetchUserOrders().catch(() => []);
    let orders = apiOrders.length > 0 ? apiOrders : getUserOrders(window.currentUser.id);
    
    console.log(`✅ Loaded ${orders.length} orders for user ${window.currentUser.email}`);
    
    if (orders.length === 0) {
      ordersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: 12px; border: 2px dashed #ddd;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🍕</div>
          <h3 style="color: #666; margin: 0 0 0.5rem;">No orders yet!</h3>
          <p style="color: #999; margin: 0 0 1.5rem;">Start by ordering some delicious pizza</p>
          <button data-action="showMenu" style="background: #ff6b35; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;">
            🍕 Browse Menu
          </button>
        </div>
      `;
    } else {
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderOrders(orders);
    }
    
    attachEventListeners(ordersGrid);
  } catch (error) {
    console.error('❌ Failed to load orders:', error);
    ordersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f8d7da; border-radius: 12px; border-left: 4px solid #dc3545;">
        <h3 style="color: #721c24; margin: 0 0 0.5rem;">⚠️ Error Loading Orders</h3>
        <p style="color: #721c24; margin: 0 0 1rem;">${error.message}</p>
        <button data-action="retry" style="background: #007bff; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;">
          🔄 Retry
        </button>
      </div>
    `;
    attachEventListeners(ordersGrid);
  }
}
export function initOrdersTab() {
  console.log('📋 Initializing Orders Tab...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOrders);
  } else {
    setTimeout(loadOrders, 100);
  }
  
  window.addEventListener('authChanged', () => {
    console.log('🔄 Auth changed, refreshing orders...');
    loadOrders();
  });
  
  console.log('✅ Orders Tab initialized');
}

// Export for global access
window.ordersTab = { loadOrders, initOrdersTab };
