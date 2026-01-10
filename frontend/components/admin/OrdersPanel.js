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
      <div id="orders-content">
        ${currentOrderTab === 'new' ? renderNewOrders(newOrders) : ''}
        ${currentOrderTab === 'progress' ? renderInProgressOrders(inProgressOrders) : ''}
        ${currentOrderTab === 'completed' ? renderCompletedOrders(completedOrders) : ''}
      </div>
    </div>

    <style>
      .order-tab:hover {
        opacity: 0.8;
      }
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

  return orders.map(order => {
    // Get customer info - handle both logged-in users and guest orders
    const customerName = order.User?.name || order.customerName || 'Guest Customer';
    const customerPhone = order.User?.phone || order.customerPhone || 'N/A';
    const customerEmail = order.User?.email || order.customerEmail || 'N/A';

    return `
      <div class="order-card new">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 300px; gap: 2rem;">
          <!-- Order Info -->
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

          <!-- Customer Info -->
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

          <!-- Order Items -->
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

          <!-- Actions -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button 
              onclick="window.acceptOrder(${order.id})" 
              style="width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;"
            >
              ✅ Accept Order
            </button>
            <button 
              onclick="window.rejectOrder(${order.id})" 
              style="width: 100%; padding: 0.75rem; background: #dc3545; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
            >
              ❌ Reject Order
            </button>
            <button 
              onclick="window.printOrder(${order.id})" 
              style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

  return orders.map(order => {
    const customerName = order.User?.name || order.customerName || 'Guest Customer';
    const customerPhone = order.User?.phone || order.customerPhone || 'N/A';

    return `
      <div class="order-card progress">
        <div style="display: grid; grid-template-columns: 1fr 1fr 300px; gap: 2rem;">
          <!-- Order Info -->
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

          <!-- Order Items -->
          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items (Total: $${parseFloat(order.total || 0).toFixed(2)})</h4>
            <div style="max-height: 140px; overflow-y: auto; font-size: 0.9rem;">
              ${(order.OrderItems || order.items || []).map(item => `
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
              onchange="window.updateOrderStatus(${order.id}, this.value)" 
              style="width: 100%; padding: 0.75rem; border: 2px solid #007bff; border-radius: 6px; font-size: 1rem; margin-bottom: 0.75rem;"
            >
              <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
              <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>${order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</option>
              <option value="completed">Mark as Completed</option>
            </select>
            <button 
              onclick="window.printOrder(${order.id})" 
              style="width: 100%; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
            >
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
          <div style="font-size: 0.9rem; color: #666;">
            <strong>${customerName}</strong> • ${order.orderType} • ${itemCount} items
          </div>
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

export async function initOrdersPanel() {
  console.log('📝 Initializing orders panel...');

  // Load orders from backend
  await loadOrdersFromBackend();

  // Auto-refresh every 15 seconds
  startAutoRefresh();

  // Global functions
  window.switchOrderTab = (tab) => {
    currentOrderTab = tab;
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.innerHTML = renderOrdersPanel();
    }
  };

  window.refreshOrders = async () => {
    console.log('🔄 Refreshing orders...');
    await loadOrdersFromBackend();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.innerHTML = renderOrdersPanel();
    }
  };

  window.acceptOrder = async (orderId) => {
    if (!confirm('Accept this order?')) return;
    console.log('✅ Accepting order:', orderId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        await loadOrdersFromBackend();
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
          adminPanel.innerHTML = renderOrdersPanel();
        }
        alert('✅ Order accepted!');
      } else {
        throw new Error('Failed to accept order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('❌ Failed to accept order. Please try again.');
    }
  };

  window.rejectOrder = async (orderId) => {
    if (!confirm('Reject this order? This cannot be undone.')) return;
    console.log('❌ Rejecting order:', orderId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        await loadOrdersFromBackend();
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
          adminPanel.innerHTML = renderOrdersPanel();
        }
        alert('❌ Order rejected');
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('❌ Failed to reject order. Please try again.');
    }
  };

  window.updateOrderStatus = async (orderId, newStatus) => {
    console.log('🔄 Updating order status:', orderId, newStatus);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadOrdersFromBackend();
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
          adminPanel.innerHTML = renderOrdersPanel();
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Failed to update order status. Please try again.');
    }
  };

  window.printOrder = (orderId) => {
    console.log('🖨️ Printing order:', orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Create a simple print view
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Order #' + orderId + '</title>');
      printWindow.document.write('<style>body{font-family: Arial; padding: 20px;} h1{color: #333;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>Order #' + orderId + '</h1>');
      printWindow.document.write('<p><strong>Customer:</strong> ' + (order.User?.name || order.customerName) + '</p>');
      printWindow.document.write('<p><strong>Phone:</strong> ' + (order.User?.phone || order.customerPhone) + '</p>');
      printWindow.document.write('<p><strong>Type:</strong> ' + order.orderType + '</p>');
      if (order.deliveryAddress) {
        printWindow.document.write('<p><strong>Address:</strong> ' + order.deliveryAddress + '</p>');
      }
      printWindow.document.write('<hr>');
      printWindow.document.write('<h3>Items:</h3>');
      (order.OrderItems || order.items || []).forEach(item => {
        printWindow.document.write('<p>' + item.quantity + 'x ' + item.name + (item.size ? ' (' + item.size + ')' : '') + '</p>');
      });
      printWindow.document.write('<hr>');
      printWindow.document.write('<h2>Total: $' + order.total + '</h2>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  window.viewOrderDetails = (orderId) => {
    console.log('👁️ Viewing order:', orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      alert('Order Details:\n\n' + JSON.stringify(order, null, 2));
    }
  };

  console.log('✅ Orders panel initialized');
}

async function loadOrdersFromBackend() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const response = await fetch('http://localhost:5001/api/orders/admin/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const result = await response.json();
    orders = result.data?.orders || result.orders || [];
    
    console.log('✅ Loaded', orders.length, 'orders from backend');
  } catch (error) {
    console.error('❌ Failed to load orders:', error);
    orders = [];
  }
}

function startAutoRefresh() {
  // Clear any existing interval
  stopAutoRefresh();
  
  // Refresh orders every 15 seconds
  refreshInterval = setInterval(async () => {
    console.log('🔄 Auto-refreshing orders...');
    await loadOrdersFromBackend();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.innerHTML.includes('Order Management')) {
      adminPanel.innerHTML = renderOrdersPanel();
    }
  }, 15000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
