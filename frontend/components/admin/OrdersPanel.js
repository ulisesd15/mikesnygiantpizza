// frontend/components/admin/OrdersPanel.js

let orders = [];
let currentOrderTab = 'new';
let refreshInterval = null;

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
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'new' ? '#ff6b35' : 'transparent'}; color: ${currentOrderTab === 'new' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'new' ? '#ff6b35' : 'transparent'}; cursor: pointer; font-weight: 600; position: relative;"
        >
          🆕 New Orders
          ${newOrders.length > 0 ? `<span class="badge">${newOrders.length}</span>` : ''}
        </button>
        <button 
          onclick="window.switchOrderTab('progress')" 
          class="order-tab ${currentOrderTab === 'progress' ? 'active' : ''}"
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'progress' ? '#007bff' : 'transparent'}; color: ${currentOrderTab === 'progress' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'progress' ? '#007bff' : 'transparent'}; cursor: pointer; font-weight: 600;"
        >
          🍳 In Progress (${inProgressOrders.length})
        </button>
        <button 
          onclick="window.switchOrderTab('completed')" 
          class="order-tab ${currentOrderTab === 'completed' ? 'active' : ''}"
          style="padding: 1rem 2rem; background: ${currentOrderTab === 'completed' ? '#28a745' : 'transparent'}; color: ${currentOrderTab === 'completed' ? 'white' : '#666'}; border: none; border-bottom: 3px solid ${currentOrderTab === 'completed' ? '#28a745' : 'transparent'}; cursor: pointer; font-weight: 600;"
        >
          ✅ Completed (${completedOrders.length})
        </button>
      </div>

      <!-- Orders Content -->
      <div id="orders-content">
        ${currentOrderTab === 'new' ? renderNewOrders(newOrders) : ''}
        ${currentOrderTab === 'progress' ? renderInProgressOrders(inProgressOrders) : ''}
        ${currentOrderTab === 'completed' ? renderCompletedOrders(completedOrders) : ''}
      </div>
    </div>

    <style>
      .badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #dc3545;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
      }
      .order-card {
        background: white;
        border: 2px solid #ddd;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        transition: all 0.3s;
      }
      .order-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .order-card.new {
        border-left: 6px solid #ff6b35;
        background: #fff5f2;
      }
      .order-card.progress {
        border-left: 6px solid #007bff;
      }
      .order-card.completed {
        border-left: 6px solid #28a745;
        opacity: 0.8;
      }
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

  return orders.map(order => `
    <div class="order-card new">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 300px; gap: 2rem;">
        <!-- Order Info -->
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <h3 style="margin: 0; color: #ff6b35; font-size: 1.3rem;">${order.orderNumber}</h3>
            <span style="background: #ff6b35; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">NEW</span>
          </div>
          <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
            <div><strong>🕒 Time:</strong> ${formatTime(order.createdAt)}</div>
            <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${order.orderType}</span></div>
            <div><strong>💵 Payment:</strong> <span style="text-transform: capitalize;">${order.paymentMethod}</span></div>
          </div>
        </div>

        <!-- Customer Info -->
        <div>
          <h4 style="margin: 0 0 0.75rem; color: #333;">👤 Customer</h4>
          <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
            <div><strong>Name:</strong> ${order.customerName}</div>
            <div><strong>Phone:</strong> ${order.customerPhone}</div>
            ${order.orderType === 'delivery' ? `<div><strong>📍 Address:</strong> ${order.deliveryAddress}</div>` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <div>
          <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items</h4>
          <div style="max-height: 120px; overflow-y: auto; font-size: 0.9rem;">
            ${order.items.map(item => `
              <div style="padding: 0.25rem 0; color: #666;">
                <strong>${item.quantity}x</strong> ${item.name} ${item.size ? `(${item.size})` : ''}
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #ddd; font-size: 1.3rem; font-weight: bold; color: #28a745;">
            Total: $${order.total}
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <button 
            onclick="window.acceptOrder('${order.id}')" 
            style="width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;"
          >
            ✅ Accept Order
          </button>
          <button 
            onclick="window.rejectOrder('${order.id}')" 
            style="width: 100%; padding: 0.75rem; background: #dc3545; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            ❌ Reject Order
          </button>
          <button 
            onclick="window.printOrder('${order.id}')" 
            style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderInProgressOrders(orders) {
  if (orders.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem; color: #999;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🍳</div>
        <h3 style="color: #666;">No orders in progress</h3>
      </div>
    `;
  }

  return orders.map(order => `
    <div class="order-card progress">
      <div style="display: grid; grid-template-columns: 1fr 1fr 300px; gap: 2rem;">
        <!-- Order Info -->
        <div>
          <h3 style="margin: 0 0 1rem; color: #007bff; font-size: 1.3rem;">${order.orderNumber}</h3>
          <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
            <div><strong>👤 Customer:</strong> ${order.customerName}</div>
            <div><strong>📞 Phone:</strong> ${order.customerPhone}</div>
            <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${order.orderType}</span></div>
            ${order.orderType === 'delivery' ? `<div><strong>📍:</strong> ${order.deliveryAddress}</div>` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <div>
          <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items (Total: $${order.total})</h4>
          <div style="max-height: 140px; overflow-y: auto; font-size: 0.9rem;">
            ${order.items.map(item => `
              <div style="padding: 0.25rem 0; color: #666;">
                <strong>${item.quantity}x</strong> ${item.name} ${item.size ? `(${item.size})` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Status Update -->
        <div>
          <h4 style="margin: 0 0 0.75rem; color: #333;">Update Status</h4>
          <select 
            onchange="window.updateOrderStatus('${order.id}', this.value)" 
            style="width: 100%; padding: 0.75rem; border: 2px solid #007bff; border-radius: 6px; font-size: 1rem; margin-bottom: 0.75rem;"
          >
            <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>${order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</option>
            <option value="completed">Mark as Completed</option>
          </select>
          <button 
            onclick="window.printOrder('${order.id}')" 
            style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCompletedOrders(orders) {
  if (orders.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem; color: #999;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
        <h3 style="color: #666;">No completed orders today</h3>
      </div>
    `;
  }

  // Show only last 20 completed orders
  const recentOrders = orders.slice(-20).reverse();

  return recentOrders.map(order => `
    <div class="order-card completed">
      <div style="display: grid; grid-template-columns: 200px 1fr 200px; gap: 2rem; align-items: center;">
        <div>
          <h4 style="margin: 0; color: #28a745;">${order.orderNumber}</h4>
          <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">${formatTime(order.createdAt)}</div>
        </div>
        <div style="font-size: 0.9rem; color: #666;">
          <strong>${order.customerName}</strong> • ${order.orderType} • ${order.items.length} items
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.2rem; font-weight: bold; color: #28a745;">$${order.total}</div>
          <button onclick="window.viewOrderDetails('${order.id}')" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">View Details</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function initOrdersPanel() {
  console.log('📝 Initializing orders panel...');

  // Load mock orders for testing
  loadMockOrders();

  // Auto-refresh every 10 seconds
  startAutoRefresh();

  // Global functions
  window.switchOrderTab = (tab) => {
    currentOrderTab = tab;
    document.getElementById('admin-panel').innerHTML = renderOrdersPanel();
  };

  window.refreshOrders = async () => {
    console.log('🔄 Refreshing orders...');
    // TODO: Fetch from API
    // const response = await fetch('/api/orders/pending');
    // orders = await response.json();
    loadMockOrders();
    document.getElementById('admin-panel').innerHTML = renderOrdersPanel();
  };

  window.acceptOrder = async (orderId) => {
    if (!confirm('Accept this order?')) return;
    console.log('✅ Accepting order:', orderId);
    // TODO: API call
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'accepted';
      document.getElementById('admin-panel').innerHTML = renderOrdersPanel();
    }
  };

  window.rejectOrder = async (orderId) => {
    if (!confirm('Reject this order? This cannot be undone.')) return;
    console.log('❌ Rejecting order:', orderId);
    // TODO: API call
    orders = orders.filter(o => o.id !== orderId);
    document.getElementById('admin-panel').innerHTML = renderOrdersPanel();
  };

  window.updateOrderStatus = async (orderId, newStatus) => {
    console.log('🔄 Updating order status:', orderId, newStatus);
    // TODO: API call
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      document.getElementById('admin-panel').innerHTML = renderOrdersPanel();
    }
  };

  window.printOrder = (orderId) => {
    console.log('🖨️ Printing order:', orderId);
    alert('Print functionality coming soon!');
  };

  window.viewOrderDetails = (orderId) => {
    console.log('👁️ Viewing order:', orderId);
    alert('Order details modal coming soon!');
  };

  console.log('✅ Orders panel initialized');
}

function startAutoRefresh() {
  // Refresh orders every 10 seconds
  refreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing orders...');
    window.refreshOrders();
  }, 10000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

function loadMockOrders() {
  // Mock orders for testing
  orders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      status: 'pending',
      orderType: 'delivery',
      customerName: 'John Doe',
      customerPhone: '(555) 123-4567',
      customerEmail: 'john@example.com',
      deliveryAddress: '123 Main St, Apt 4B, San Diego, CA 92101',
      paymentMethod: 'cash',
      items: [
        { menuItemId: 1, name: 'Greek Pizza', size: '16"', quantity: 1, price: 16.99 },
        { menuItemId: 2, name: 'Buffalo Wings', size: '10pc', quantity: 1, price: 10.99 }
      ],
      subtotal: 27.98,
      tax: 2.31,
      deliveryFee: 3.99,
      total: 34.28,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      status: 'preparing',
      orderType: 'pickup',
      customerName: 'Jane Smith',
      customerPhone: '(555) 987-6543',
      customerEmail: 'jane@example.com',
      deliveryAddress: '',
      paymentMethod: 'cash',
      items: [
        { menuItemId: 3, name: 'Meat Lovers', size: '20"', quantity: 2, price: 24.99 }
      ],
      subtotal: 49.98,
      tax: 4.12,
      deliveryFee: 0,
      total: 54.10,
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ];
}
