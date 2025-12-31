// ordersTab.js - COMPLETE + AUTH PROTECTED
export function renderOrdersTab() {
  return `
    <div id="orders-tab" class="tab-content" style="display: none;">
      <div style="text-align: center; padding: 2rem; background: #f0f8ff; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="color: #28a745;">📋 My Orders</h2>
        <p>Your order history appears here</p>
      </div>
      <div id="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 3rem; color: #666;">No orders yet - place one above! 🍕</div>
      </div>
    </div>
  `;
}

export async function loadOrders() {
  // AUTH CHECK FIRST
  if (!window.currentUser) {
    document.getElementById('orders-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #ff6b35; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">👋 <strong>Please login</strong> to see your orders!</div>';
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      headers: window.currentUser ? { 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      } : {}
    });
    
    if (res.ok) {
      const orders = await res.json();
      renderOrders(orders);
    } else if (res.status === 401) {
      document.getElementById('orders-grid').innerHTML = 
        '<div style="text-align: center; padding: 3rem; color: #dc3545;">🔐 Please <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login</button> to see orders</div>';
    }
  } catch (error) {
    console.error('Orders load failed:', error);
    document.getElementById('orders-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #666;">⚠️ Failed to load orders - try again</div>';
  }
}

export function renderOrders(orders) {
  const container = document.getElementById('orders-grid');
  
  if (!orders || orders.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">No orders yet - order some pizza! 🍕</div>';
    return;
  }
  
  container.innerHTML = orders.map(order => orderCard(order)).join('');
}

// ✅ EXPORT orderCard (was private)
export function orderCard(order) {
  const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return `
    <div class="menu-card order-card" style="border-left: 5px solid #28a745; hover: transform(translateY(-2px));">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0; color: #28a745;">Order #${order.id}</h3>
        <span style="font-size: 1.2rem; font-weight: bold; color: #28a745;">$${total.toFixed(2)}</span>
      </div>
      <p style="color: #666; margin: 0 0 1rem;"><small>Placed: ${new Date(order.timestamp).toLocaleString()}</small></p>
      <div style="font-size: 0.9rem; background: #f8f9fa; padding: 1rem; border-radius: 8px;">
        ${order.items.map(item => 
          `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
            <span>${item.emoji || '🍕'} ${item.name} (${item.size || 'N/A'}) x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>`
        ).join('')}
      </div>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #28a745; font-weight: bold; font-size: 1.2rem; color: #28a745;">
        💰 Total: $${total.toFixed(2)}
      </div>
    </div>
  `;
}
