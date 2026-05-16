// frontend/components/admin/OrdersPanel.jsx

import './OrdersPanel.css';

let orders = [];
let currentOrderTab = 'new';
let refreshInterval = null;

// ========================================
// RENDER FUNCTIONS
// ========================================
export function renderOrdersPanel() {
  const newOrders = orders.filter(o => o.status === 'pending');
  const inProgressOrders = orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return `
    <div style="max-width: 1400px; margin: 0 auto; padding: 2rem;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 style="margin: 0 0 0.5rem; color: #333;">📝 Order Management</h1>
          <p style="margin: 0; color: #666;">Manage incoming orders and update their status</p>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.85rem; color: #666;">New Orders</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #ff6b35;">${newOrders.length}</div>
          </div>
          <button onclick="window.refreshOrders()" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Order Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 2px solid #ddd;">
        <button 
          onclick="window.switchOrderTab('new')" 
          class="order-tab ${currentOrderTab === 'new' ? 'active' : ''}"
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'new' ? '#ff6b35' : 'transparent'}; color: ${currentOrderTab === 'new' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'new' ? '#ff6b35' : 'transparent'}; cursor: pointer; font-weight: 600; transition: all 0.3s; position: relative;"
        >
          🆕 New Orders
          ${newOrders.length > 0 ? `<span class="badge">${newOrders.length}</span>` : ''}
        </button>
        <button 
          onclick="window.switchOrderTab('progress')" 
          class="order-tab ${currentOrderTab === 'progress' ? 'active' : ''}"
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'progress' ? '#007bff' : 'transparent'}; color: ${currentOrderTab === 'progress' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'progress' ? '#007bff' : 'transparent'}; cursor: pointer; font-weight: 600; transition: all 0.3s;"
        >
          🍳 In Progress (${inProgressOrders.length})
        </button>
        <button 
          onclick="window.switchOrderTab('completed')" 
          class="order-tab ${currentOrderTab === 'completed' ? 'active' : ''}"
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'completed' ? '#28a745' : 'transparent'}; color: ${currentOrderTab === 'completed' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'completed' ? '#28a745' : 'transparent'}; cursor: pointer; font-weight: 600; transition: all 0.3s;"
        >
          ✅ Completed (${completedOrders.length})
        </button>
      </div>

      <!-- Orders Content -->
      <div id="orders-content"></div>
    </div>

    <style>
      .order-tab:hover { opacity: 0.8; }
      .badge {
        position: absolute; top: 0.5rem; right: 0.5rem;
        background: #dc3545; color: white; border-radius: 50%;
        width: 24px; height: 24px; display: flex;
        align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: bold;
      }
      .order-card {
        background: white; border: 2px solid #ddd;
        border-radius: 12px; padding: 1.5rem;
        margin-bottom: 1.5rem; transition: all 0.3s;
      }
      .order-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .order-card.new { border-left: 6px solid #ff6b35; background: #fff5f2; }
      .order-card.progress { border-left: 6px solid #007bff; }
      .order-card.completed { border-left: 6px solid #28a745; opacity: 0.8; }
    </style>
  `;
}

function renderNewOrders(orders) {
  if (orders.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem; color: #999;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
        <h3 style="color: #666;">No new orders</h3>
        <p>New orders will appear here automatically</p>
      </div>
    `;
  }

  return orders.map(order => {
    const customerName = order.User?.name || order.customerName || 'Guest Customer';
    const customerPhone = order.User?.phone || order.customerPhone || 'N/A';
    const customerEmail = order.User?.email || order.customerEmail || 'N/A';

    return `
      <div class="order-card new">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 300px; gap: 2rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
              <h3 style="margin: 0; color: #ff6b35; font-size: 1.3rem;">Order #${order.id}</h3>
              <span style="background: #ff6b35; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">NEW</span>
            </div>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>🕒 Time:</strong> ${formatTime(order.createdAt)}</div>
              <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${order.orderType}</span></div>
              <div><strong>💵 Payment:</strong> <span style="text-transform: capitalize;">${order.paymentMethod || 'cash'}</span></div>
            </div>
          </div>
          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">👤 Customer</h4>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>Name:</strong> ${customerName}</div>
              <div><strong>Phone:</strong> ${customerPhone}</div>
              <div><strong>Email:</strong> ${customerEmail}</div>
              ${order.orderType === 'delivery' && order.deliveryAddress ? `<div style="margin-top: 0.5rem;"><strong>📍 Address:</strong><br>${order.deliveryAddress}</div>` : ''}
              ${order.deliveryInstructions ? `<div style="margin-top: 0.5rem;"><strong>📝 Notes:</strong> ${order.deliveryInstructions}</div>` : ''}
            </div>
          </div>
          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items</h4>
            <div style="max-height: 120px; overflow-y: auto; font-size: 0.9rem;">
              ${(order.OrderItems || order.items || []).map(item => `
                <div style="padding: 0.25rem 0; color: #666;">
                  <strong>${item.quantity}x</strong> ${item.name} ${item.size ? `(${item.size})` : ''}
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #ddd; font-size: 1.3rem; font-weight: bold; color: #28a745;">
              Total: $${parseFloat(order.total || 0).toFixed(2)}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button onclick="window.acceptOrder(${order.id})" style="width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;">✅ Accept Order</button>
            <button onclick="window.rejectOrder(${order.id})" style="width: 100%; padding: 0.75rem; background: #dc3545; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">❌ Reject Order</button>
            <button onclick="window.printOrder(${order.id})" style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🖨️ Print</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderInProgressOrders(orders) {
  if (orders.length === 0) {
    return `<div style="text-align: center; padding: 4rem; color: #999;"><div style="font-size: 4rem; margin-bottom: 1rem;">🍳</div><h3 style="color: #666;">No orders in progress</h3></div>`;
  }

  return orders.map(order => {
    const customerName = order.User?.name || order.customerName || 'Guest Customer';
    const customerPhone = order.User?.phone || order.customerPhone || 'N/A';

    return `
      <div class="order-card progress">
        <div style="display: grid; grid-template-columns: 1fr 1fr 300px; gap: 2rem;">
          <div>
            <h3 style="margin: 0 0 1rem; color: #007bff; font-size: 1.3rem;">Order #${order.id}</h3>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>👤 Customer:</strong> ${customerName}</div>
              <div><strong>📞 Phone:</strong> ${customerPhone}</div>
              <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${order.orderType}</span></div>
              ${order.orderType === 'delivery' && order.deliveryAddress ? `<div><strong>📍:</strong> ${order.deliveryAddress}</div>` : ''}
              <div style="margin-top: 0.5rem;"><strong>Status:</strong> <span style="text-transform: uppercase; color: #007bff; font-weight: 600;">${order.status}</span></div>
            </div>
          </div>
          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items (Total: $${parseFloat(order.total || 0).toFixed(2)})</h4>
            <div style="max-height: 140px; overflow-y: auto; font-size: 0.9rem;">
              ${(order.OrderItems || order.items || []).map(item => `<div style="padding: 0.25rem 0; color: #666;"><strong>${item.quantity}x</strong> ${item.name} ${item.size ? `(${item.size})` : ''}</div>`).join('')}
            </div>
          </div>
          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">Update Status</h4>
            <select onchange="window.updateOrderStatus(${order.id}, this.value)" style="width: 100%; padding: 0.75rem; border: 2px solid #007bff; border-radius: 6px; font-size: 1rem; margin-bottom: 0.75rem;">
              <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
              <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>${order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</option>
              <option value="completed">Mark as Completed</option>
            </select>
            <button onclick="window.printOrder(${order.id})" style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🖨️ Print Receipt</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCompletedOrders(orders) {
  if (orders.length === 0) {
    return `<div style="text-align: center; padding: 4rem; color: #999;"><div style="font-size: 4rem; margin-bottom: 1rem;">✅</div><h3 style="color: #666;">No completed orders today</h3></div>`;
  }

  const recentOrders = orders.slice(-20).reverse();

  return recentOrders.map(order => {
    const customerName = order.User?.name || order.customerName || 'Guest Customer';
    const itemCount = (order.OrderItems || order.items || []).length;

    return `
      <div class="order-card completed">
        <div style="display: grid; grid-template-columns: 200px 1fr 200px; gap: 2rem; align-items: center;">
          <div>
            <h4 style="margin: 0; color: #28a745;">Order #${order.id}</h4>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">${formatTime(order.createdAt)}</div>
          </div>
          <div style="font-size: 0.9rem; color: #666;"><strong>${customerName}</strong> • ${order.orderType} • ${itemCount} items</div>
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: bold; color: #28a745;">$${parseFloat(order.total || 0).toFixed(2)}</div>
            <button onclick="window.viewOrderDetails(${order.id})" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">View Details</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ========================================
// API HELPER FUNCTIONS
// ========================================
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('⚠️ No token found');
    return null; // ✅ Return null instead of throwing
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('📤 Making request to:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Token invalid or expired');
        // ✅ Return null instead of throwing - let calling function handle it
        return null;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('❌ Request failed:', error);
    throw error;
  }
}

async function loadOrdersFromBackend() {
  try {
    console.log('📥 Loading orders from backend...');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔍 Auth check:');
    console.log('  - Token exists:', !!token);
    console.log('  - User role:', user.role);
    
    // ✅ Don't throw errors, just show messages
    if (!token) {
      showNotification('Please log in to view orders', 'warning');
      orders = [];
      return [];
    }
    
    if (user.role !== 'admin') {
      showNotification('Admin access required', 'error');
      orders = [];
      return [];
    }
    
    // ✅ Make the request
    const result = await makeAuthenticatedRequest('http://localhost:5001/api/admin/admin/all');
    
    // ✅ Handle null response (auth failed)
    if (!result) {
      console.warn('⚠️ No data received - likely auth issue');
      showNotification('Please refresh and log in again', 'warning');
      orders = [];
      return [];
    }
    
    orders = result.data?.orders || result.orders || [];
    
    console.log('✅ Loaded', orders.length, 'orders');
    return orders;
    
  } catch (error) {
    console.error('❌ Failed to load orders:', error);
    showNotification(error.message || 'Failed to load orders', 'error');
    orders = [];
    return [];
  }
}

// ========================================
// ORDER ACTION FUNCTIONS
// ========================================
async function acceptOrder(orderId) {
  try {
    console.log('✅ Accepting order:', orderId);
    const result = await makeAuthenticatedRequest(`http://localhost:5001/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'accepted' })
    });
    
    if (!result) {
      showNotification('Authentication required', 'error');
      return;
    }
    
    showNotification('Order accepted successfully!', 'success');
    await refreshOrders();
  } catch (error) {
    console.error('❌ Error accepting order:', error);
    showNotification('Failed to accept order: ' + error.message, 'error');
  }
}

async function rejectOrder(orderId) {
  if (!confirm('Are you sure you want to reject this order?')) return;

  try {
    console.log('❌ Rejecting order:', orderId);
    const result = await makeAuthenticatedRequest(`http://localhost:5001/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' })
    });
    
    if (!result) {
      showNotification('Authentication required', 'error');
      return;
    }
    
    showNotification('Order rejected', 'info');
    await refreshOrders();
  } catch (error) {
    console.error('❌ Error rejecting order:', error);
    showNotification('Failed to reject order: ' + error.message, 'error');
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);
    const result = await makeAuthenticatedRequest(`http://localhost:5001/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!result) {
      showNotification('Authentication required', 'error');
      return;
    }
    
    showNotification(`Order status updated to ${newStatus}`, 'success');
    await refreshOrders();
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    showNotification('Failed to update order: ' + error.message, 'error');
  }
}

function printOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    showNotification('Order not found', 'error');
    return;
  }

  const printWindow = window.open('', '_blank');
  const customerName = order.User?.name || order.customerName || 'Guest Customer';
  const customerPhone = order.User?.phone || order.customerPhone || 'N/A';
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Order #${order.id} - Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          h1 { text-align: center; border-bottom: 3px solid #333; padding-bottom: 10px; }
          .order-info { margin: 20px 0; line-height: 1.8; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 5px 0; }
          .total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 1.2em; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>ORDER RECEIPT #${order.id}</h1>
        <div class="order-info">
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${customerName}</div>
          <div><strong>Phone:</strong> ${customerPhone}</div>
          <div><strong>Type:</strong> ${order.orderType.toUpperCase()}</div>
          ${order.orderType === 'delivery' ? `<div><strong>Address:</strong> ${order.deliveryAddress}</div>` : ''}
          ${order.deliveryInstructions ? `<div><strong>Instructions:</strong> ${order.deliveryInstructions}</div>` : ''}
        </div>
        <div class="items">
          <h2>Items:</h2>
          ${(order.OrderItems || order.items || []).map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.name} ${item.size ? `(${item.size})` : ''}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">
          <div class="item">
            <span>TOTAL:</span>
            <span>$${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Receipt</button>
      </body>
    </html>
  `);
  
  printWindow.document.close();
}

function viewOrderDetails(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    showNotification('Order not found', 'error');
    return;
  }

  const customerName = order.User?.name || order.customerName || 'Guest Customer';
  const customerEmail = order.User?.email || order.customerEmail || 'N/A';
  const customerPhone = order.User?.phone || order.customerPhone || 'N/A';
  
  alert(`
ORDER #${order.id} DETAILS

Customer: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Type: ${order.orderType}
Status: ${order.status}
Payment: ${order.paymentMethod}
${order.deliveryAddress ? `Address: ${order.deliveryAddress}` : ''}

Items:
${(order.OrderItems || order.items || []).map(item => 
  `- ${item.quantity}x ${item.name} ${item.size ? `(${item.size})` : ''} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

Total: $${parseFloat(order.total).toFixed(2)}
Created: ${new Date(order.createdAt).toLocaleString()}
  `.trim());
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(message, type = 'info') {
  const existing = document.getElementById('order-notification');
  if (existing) existing.remove();

  const colors = { success: '#28a745', error: '#dc3545', info: '#007bff', warning: '#ffc107' };

  const notification = document.createElement('div');
  notification.id = 'order-notification';
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${colors[type] || colors.info}; color: white;
    padding: 1rem 1.5rem; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000; animation: slideIn 0.3s ease-out;
    max-width: 400px; font-weight: 600;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ========================================
// AUTO-REFRESH
// ========================================
function startAutoRefresh() {
  stopAutoRefresh();
  console.log('🔄 Starting auto-refresh (every 15 seconds)');
  refreshInterval = setInterval(async () => {
    console.log('🔄 Auto-refreshing orders...');
    await loadOrdersFromBackend();
    const ordersContent = document.getElementById('orders-content');
    if (ordersContent && ordersContent.innerHTML) {
      window.switchOrderTab(currentOrderTab);
    }
  }, 15000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏹️ Stopped auto-refresh');
  }
}

async function refreshOrders() {
  console.log('🔄 Manual refresh triggered');
  await loadOrdersFromBackend();
  window.switchOrderTab(currentOrderTab);
}

// ========================================
// INITIALIZATION
// ========================================
export async function initOrdersPanel() {
  console.log('📝 Initializing orders panel...');
  
  // ✅ Check auth before doing anything
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || user.role !== 'admin') {
    console.warn('⚠️ Not authenticated as admin');
    const ordersContent = document.getElementById('orders-content');
    if (ordersContent) {
      ordersContent.innerHTML = `
        <div style="text-align: center; padding: 4rem; background: #fff3cd; border-radius: 12px; border: 2px solid #ffc107;">
          <h3 style="color: #856404; margin: 0 0 1rem;">🔒 Admin Access Required</h3>
          <p style="color: #856404; margin: 0 0 1.5rem;">Please log in with an admin account</p>
          <button 
            onclick="window.location.reload()" 
            style="background: #007bff; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;"
          >
            Refresh Page
          </button>
        </div>
      `;
    }
    return;
  }
  
  await loadOrdersFromBackend();
  startAutoRefresh();
  
  window.switchOrderTab = (tab) => {
    console.log('🔄 Switching to tab:', tab);
    currentOrderTab = tab;
    
    document.querySelectorAll('.order-tab').forEach(btn => {
      btn.classList.remove('active');
      btn.style.background = 'transparent';
      btn.style.color = '#666';
      btn.style.borderBottomColor = 'transparent';
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.order-tab')).find(btn => 
      btn.getAttribute('onclick').includes(tab)
    );
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.background = tab === 'new' ? '#ff6b35' : tab === 'progress' ? '#007bff' : '#28a745';
      activeBtn.style.color = 'white';
      activeBtn.style.borderBottomColor = tab === 'new' ? '#ff6b35' : tab === 'progress' ? '#007bff' : '#28a745';
    }
    
    const ordersContent = document.getElementById('orders-content');
    if (ordersContent) {
      const newOrdersHtml = renderNewOrders(orders.filter(o => o.status === 'pending'));
      const progressOrdersHtml = renderInProgressOrders(orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)));
      const completedOrdersHtml = renderCompletedOrders(orders.filter(o => o.status === 'completed'));
      
      ordersContent.innerHTML = `
        ${tab === 'new' ? newOrdersHtml : ''}
        ${tab === 'progress' ? progressOrdersHtml : ''}
        ${tab === 'completed' ? completedOrdersHtml : ''}
      `;
    }
  };
  
  window.refreshOrders = refreshOrders;
  window.acceptOrder = acceptOrder;
  window.rejectOrder = rejectOrder;
  window.updateOrderStatus = updateOrderStatus;
  window.printOrder = printOrder;
  window.viewOrderDetails = viewOrderDetails;
  
  setTimeout(() => window.switchOrderTab('new'), 100);
  console.log('✅ Orders panel fully initialized');
}

export function cleanupOrdersPanel() {
  stopAutoRefresh();
  console.log('🧹 Orders panel cleaned up');
}
