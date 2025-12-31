// ordersTab.js
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
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const orders = await res.json();
      renderOrders(orders, 'orders-grid');
    }
  } catch {
    document.getElementById('orders-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #666;">Login to see orders!</div>';
  }
}

export function renderOrders(orders, containerId) {
  const container = document.getElementById(containerId);
  if (orders.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">No orders yet - order some pizza! 🍕</div>';
    return;
  }
  container.innerHTML = orders.map(order => orderCard(order)).join('');
}

function orderCard(order) {
  const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return `
    <div class="menu-card order-card" style="border-left: 5px solid #28a745;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0; color: #28a745;">Order #${order.id}</h3>
        <span style="font-size: 1.2rem; font-weight: bold;">$${total.toFixed(2)}</span>
      </div>
      <p style="color: #666; margin: 0 0 1rem;"><small>Placed: ${new Date(order.timestamp).toLocaleString()}</small></p>
      <div style="font-size: 0.9rem;">
        ${order.items.map(item => 
          `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
            <span>${item.name} (${item.size}) x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>`
        ).join('')}
      </div>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-weight: bold;">
        Total: $${total.toFixed(2)}
      </div>
    </div>
  `;
}
