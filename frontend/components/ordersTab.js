// ordersTab.js - User orders with localStorage integration


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

export async function loadOrders() {
  console.log('📋 Loading user orders...');
  
  const ordersGrid = document.getElementById('orders-grid');
  
  // Check if user is logged in
  if (!window.currentUser) {
    ordersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff3cd; border-radius: 12px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin: 0 0 1rem;">🔒 Login Required</h3>
        <p style="color: #856404; margin: 0 0 1.5rem;">Please login to view your order history</p>
        <button 
          onclick="showAuth()" 
          style="background: #007bff; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;"
        >
          🔑 Login / Register
        </button>
      </div>
    `;
    return;
  }

  try {
    // Load orders from localStorage
    const orders = getUserOrders(window.currentUser.id);
    
    console.log(`✅ Loaded ${orders.length} orders for user ${window.currentUser.email}`);
    
    if (orders.length === 0) {
      ordersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: 12px; border: 2px dashed #ddd;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🍕</div>
          <h3 style="color: #666; margin: 0 0 0.5rem;">No orders yet!</h3>
          <p style="color: #999; margin: 0 0 1.5rem;">Start by ordering some delicious pizza</p>
          <button 
            onclick="showTab('menu')" 
            style="background: #ff6b35; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;"
          >
            🍕 Browse Menu
          </button>
        </div>
      `;
    } else {
      // Sort orders by date (newest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderOrders(orders);
    }
  } catch (error) {
    console.error('❌ Failed to load orders:', error);
    ordersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f8d7da; border-radius: 12px; border-left: 4px solid #dc3545;">
        <h3 style="color: #721c24; margin: 0 0 0.5rem;">⚠️ Error Loading Orders</h3>
        <p style="color: #721c24; margin: 0 0 1rem;">Failed to load your orders. Please try again.</p>
        <button 
          onclick="loadOrders()" 
          style="background: #007bff; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;"
        >
          🔄 Retry
        </button>
      </div>
    `;
  }
}

export function renderOrders(orders) {
  const container = document.getElementById('orders-grid');
  
  if (!orders || orders.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">No orders yet - order some pizza! 🍕</div>';
    return;
  }
  
  container.innerHTML = orders.map(order => orderCard(order)).join('');
}

export function orderCard(order) {
  const statusColors = {
    pending: { bg: '#fff3cd', border: '#ffc107', text: '#856404', emoji: '⏳' },
    preparing: { bg: '#cfe2ff', border: '#0d6efd', text: '#084298', emoji: '👨‍🍳' },
    ready: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '✅' },
    delivered: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '🚚' },
    completed: { bg: '#d1e7dd', border: '#198754', text: '#0f5132', emoji: '✅' }
  };
  
  const statusInfo = statusColors[order.status] || statusColors.pending;
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  return `
    <div class="menu-card" style="border-left: 5px solid ${statusInfo.border}; transition: all 0.3s;">
      <!-- Order Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h3 style="margin: 0; color: #333; font-size: 1.2rem;">Order #${order.orderNumber}</h3>
          <p style="color: #999; margin: 0.25rem 0 0; font-size: 0.85rem;">${formattedDate}</p>
        </div>
        <div style="text-align: right;">
          <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem; border: 2px solid ${statusInfo.border};">
            ${statusInfo.emoji} ${order.status.toUpperCase()}
          </div>
        </div>
      </div>

      <!-- Order Type -->
      <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="font-weight: 600; color: #666; font-size: 0.9rem;">
          ${order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
        </div>
        ${order.orderType === 'delivery' && order.deliveryAddress ? `
          <div style="font-size: 0.85rem; color: #999; margin-top: 0.25rem;">${order.deliveryAddress}</div>
        ` : ''}
      </div>

      <!-- Order Items -->
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #666;">Order Items:</h4>
        ${order.items.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
              <span style="font-weight: 600;">🍕 ${item.name}</span>
              ${item.size ? `<span style="color: #666; font-size: 0.85rem;"> (${item.size})</span>` : ''}
              <span style="color: #999; font-size: 0.85rem;"> x${item.quantity}</span>
            </div>
            <span style="font-weight: 600; color: #28a745;">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <!-- Order Total -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid ${statusInfo.border};">
        <span style="font-weight: 600; font-size: 1.1rem; color: #333;">Total:</span>
        <span style="font-weight: bold; font-size: 1.3rem; color: #28a745;">$${order.total.toFixed(2)}</span>
      </div>

      <!-- Customer Info (for reference) -->
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.85rem; color: #999;">
        <div>👤 ${order.customerName}</div>
        <div>📧 ${order.customerEmail}</div>
        <div>📱 ${order.customerPhone}</div>
      </div>
    </div>
  `;
}
