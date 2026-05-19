// frontend/components/admin/OrdersPanel.jsx
import './OrdersPanel.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let orders = [];
let currentOrderTab = 'new';
let refreshInterval = null;
let activeStatusUpdates = new Set();
let authFailureHandled = false;
let suppressNextAuthWarningUntil = 0;

// ========================================
// NORMALIZATION HELPERS
// ========================================
function getOrderItems(order) {
  return order?.OrderItems || order?.orderItems || order?.items || [];
}

function getMenuItemName(item) {
  return (
    item?.name ||
    item?.menuItem?.name ||
    item?.MenuItem?.name ||
    'Unnamed item'
  );
}

function getMenuItemSize(item) {
  return item?.size || item?.menuItem?.size || item?.MenuItem?.size || '';
}

function getItemUnitPrice(item) {
  return Number(
    item?.price ??
    item?.unitPrice ??
    item?.menuItem?.price ??
    item?.MenuItem?.price ??
    0
  );
}

function getItemQuantity(item) {
  return Number(item?.quantity || 0);
}

function getOrderTotal(order) {
  return Number(order?.totalPrice ?? order?.total ?? 0);
}

function getCustomerName(order) {
  return (
    order?.User?.name ||
    order?.user?.name ||
    order?.customerName ||
    'Guest Customer'
  );
}

function getCustomerPhone(order) {
  return (
    order?.User?.phone ||
    order?.user?.phone ||
    order?.customerPhone ||
    'N/A'
  );
}

function getCustomerEmail(order) {
  return (
    order?.User?.email ||
    order?.user?.email ||
    order?.customerEmail ||
    'N/A'
  );
}

function getOrderType(order) {
  return order?.orderType || 'pickup';
}

function getPaymentMethod(order) {
  return order?.paymentMethod || 'cash';
}

function getOrderNumber(order) {
  return order?.orderNumber || order?.id;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeOrder(order = {}) {
  const items = getOrderItems(order).map((item) => {
    const quantity = getItemQuantity(item);
    const price = getItemUnitPrice(item);

    return {
      id: item?.id,
      quantity,
      price,
      name: getMenuItemName(item),
      size: getMenuItemSize(item),
      addedToppings: item?.addedToppings || item?.added_toppings || [],
      removedToppings: item?.removedToppings || item?.removed_toppings || [],
      subtotal: Number((price * quantity).toFixed(2))
    };
  });

  const derivedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalPrice = getOrderTotal(order) || derivedTotal;

  return {
    id: order?.id,
    orderNumber: getOrderNumber(order),
    createdAt: order?.createdAt,
    status: String(order?.status || 'pending').toLowerCase(),
    orderType: getOrderType(order),
    paymentMethod: getPaymentMethod(order),
    deliveryAddress: order?.deliveryAddress || '',
    deliveryInstructions: order?.deliveryInstructions || '',
    customerName: getCustomerName(order),
    customerPhone: getCustomerPhone(order),
    customerEmail: getCustomerEmail(order),
    totalPrice: Number(totalPrice || 0),
    items
  };
}

function normalizeOrders(payload) {
  const rawOrders = payload?.data?.orders || payload?.orders || payload?.data || [];
  return Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [];
}

function isUpdatingOrder(orderId) {
  return activeStatusUpdates.has(String(orderId));
}

function setOrderUpdating(orderId, isUpdating) {
  const key = String(orderId);
  if (isUpdating) {
    activeStatusUpdates.add(key);
  } else {
    activeStatusUpdates.delete(key);
  }
}

function getOrdersByTab(tab) {
  if (tab === 'new') {
    return orders.filter((o) => o.status === 'pending');
  }

  if (tab === 'progress') {
    return orders.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.status));
  }

  if (tab === 'completed') {
    return orders.filter((o) => ['completed', 'cancelled'].includes(o.status));
  }

  return [];
}

// ========================================
// RENDER FUNCTIONS
// ========================================
export function renderOrdersPanel() {
  const newOrders = getOrdersByTab('new');
  const inProgressOrders = getOrdersByTab('progress');
  const completedOrders = getOrdersByTab('completed');

  return `
    <div style="max-width: 1400px; margin: 0 auto; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;">
        <div>
          <h1 style="margin: 0 0 0.5rem; color: #333;">📝 Order Management</h1>
          <p style="margin: 0; color: #666;">Manage incoming orders and update their status</p>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center; min-width: 110px;">
            <div style="font-size: 0.85rem; color: #666;">New Orders</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #ff6b35;">${newOrders.length}</div>
          </div>

          <button
            onclick="window.refreshOrders()"
            style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 2px solid #ddd; flex-wrap: wrap;">
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
          ✅ History (${completedOrders.length})
        </button>
      </div>

      <div id="orders-content"></div>
    </div>

    <style>
      .order-tab:hover { opacity: 0.85; }

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
        opacity: 0.95;
      }

      .order-card.cancelled {
        border-left: 6px solid #dc3545;
        opacity: 0.92;
        background: #fff5f5;
      }

      .order-toppings {
        margin: 0.35rem 0 0.25rem 1.5rem;
        font-size: 0.82rem;
        color: #777;
      }

      .order-action-btn[disabled],
      .order-status-select[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
      }

      @media (max-width: 1100px) {
        .order-grid-new,
        .order-grid-progress,
        .order-grid-completed {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
}

function renderOrderItems(items) {
  if (!items.length) {
    return `<div style="color: #999;">No items found</div>`;
  }

  return items.map((item) => `
    <div style="padding: 0.35rem 0; color: #666;">
      <strong>${item.quantity}x</strong> ${escapeHtml(item.name)} ${item.size ? `(${escapeHtml(item.size)})` : ''}
      ${item.addedToppings?.length ? `
        <div class="order-toppings">
          + Add: ${item.addedToppings.map((t) => escapeHtml(t.name || t)).join(', ')}
        </div>
      ` : ''}
      ${item.removedToppings?.length ? `
        <div class="order-toppings">
          - Remove: ${item.removedToppings.map((t) => escapeHtml(t.name || t)).join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderNewOrders(newOrders) {
  if (newOrders.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem; color: #999;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
        <h3 style="color: #666;">No new orders</h3>
        <p>New orders will appear here automatically</p>
      </div>
    `;
  }

  return newOrders.map((order) => {
    const busy = isUpdatingOrder(order.id);

    return `
      <div class="order-card new">
        <div class="order-grid-new" style="display: grid; grid-template-columns: 1fr 1fr 1fr 300px; gap: 2rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
              <h3 style="margin: 0; color: #ff6b35; font-size: 1.3rem;">Order #${escapeHtml(order.orderNumber)}</h3>
              <span style="background: #ff6b35; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">NEW</span>
            </div>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>🕒 Time:</strong> ${escapeHtml(formatTime(order.createdAt))}</div>
              <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${escapeHtml(order.orderType)}</span></div>
              <div><strong>💵 Payment:</strong> <span style="text-transform: capitalize;">${escapeHtml(order.paymentMethod)}</span></div>
            </div>
          </div>

          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">👤 Customer</h4>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>Name:</strong> ${escapeHtml(order.customerName)}</div>
              <div><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>
              <div><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</div>
              ${order.orderType === 'delivery' && order.deliveryAddress ? `<div style="margin-top: 0.5rem;"><strong>📍 Address:</strong><br>${escapeHtml(order.deliveryAddress)}</div>` : ''}
              ${order.deliveryInstructions ? `<div style="margin-top: 0.5rem;"><strong>📝 Notes:</strong> ${escapeHtml(order.deliveryInstructions)}</div>` : ''}
            </div>
          </div>

          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items</h4>
            <div style="max-height: 160px; overflow-y: auto; font-size: 0.9rem;">
              ${renderOrderItems(order.items)}
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #ddd; font-size: 1.3rem; font-weight: bold; color: #28a745;">
              Total: $${order.totalPrice.toFixed(2)}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button
              onclick="window.acceptOrder(${order.id})"
              class="order-action-btn"
              ${busy ? 'disabled' : ''}
              style="width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;"
            >
              ${busy ? '⏳ Working...' : '✅ Accept Order'}
            </button>

            <button
              onclick="window.rejectOrder(${order.id})"
              class="order-action-btn"
              ${busy ? 'disabled' : ''}
              style="width: 100%; padding: 0.75rem; background: #dc3545; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
            >
              ${busy ? '⏳ Working...' : '❌ Reject Order'}
            </button>

            <button
              onclick="window.printOrder(${order.id})"
              class="order-action-btn"
              ${busy ? 'disabled' : ''}
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

function renderInProgressOrders(inProgressOrders) {
  if (inProgressOrders.length === 0) {
    return `<div style="text-align: center; padding: 4rem; color: #999;"><div style="font-size: 4rem; margin-bottom: 1rem;">🍳</div><h3 style="color: #666;">No orders in progress</h3></div>`;
  }

  return inProgressOrders.map((order) => {
    const busy = isUpdatingOrder(order.id);

    return `
      <div class="order-card progress">
        <div class="order-grid-progress" style="display: grid; grid-template-columns: 1fr 1fr 300px; gap: 2rem;">
          <div>
            <h3 style="margin: 0 0 1rem; color: #007bff; font-size: 1.3rem;">Order #${escapeHtml(order.orderNumber)}</h3>
            <div style="font-size: 0.9rem; color: #666; line-height: 1.8;">
              <div><strong>👤 Customer:</strong> ${escapeHtml(order.customerName)}</div>
              <div><strong>📞 Phone:</strong> ${escapeHtml(order.customerPhone)}</div>
              <div><strong>🚚 Type:</strong> <span style="text-transform: capitalize;">${escapeHtml(order.orderType)}</span></div>
              ${order.orderType === 'delivery' && order.deliveryAddress ? `<div><strong>📍:</strong> ${escapeHtml(order.deliveryAddress)}</div>` : ''}
              <div style="margin-top: 0.5rem;"><strong>Status:</strong> <span style="text-transform: uppercase; color: #007bff; font-weight: 600;">${escapeHtml(order.status)}</span></div>
            </div>
          </div>

          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">🍕 Items (Total: $${order.totalPrice.toFixed(2)})</h4>
            <div style="max-height: 160px; overflow-y: auto; font-size: 0.9rem;">
              ${renderOrderItems(order.items)}
            </div>
          </div>

          <div>
            <h4 style="margin: 0 0 0.75rem; color: #333;">Update Status</h4>
            <select
              onchange="window.updateOrderStatus(${order.id}, this)"
              class="order-status-select"
              ${busy ? 'disabled' : ''}
              style="width: 100%; padding: 0.75rem; border: 2px solid #007bff; border-radius: 6px; font-size: 1rem; margin-bottom: 0.75rem;"
            >
              <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
              <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>${order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</option>
              <option value="completed">Mark as Completed</option>
            </select>

            <button
              onclick="window.printOrder(${order.id})"
              class="order-action-btn"
              ${busy ? 'disabled' : ''}
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

function renderCompletedOrders(completedOrders) {
  if (completedOrders.length === 0) {
    return `<div style="text-align: center; padding: 4rem; color: #999;"><div style="font-size: 4rem; margin-bottom: 1rem;">✅</div><h3 style="color: #666;">No completed or cancelled orders yet</h3></div>`;
  }

  const recentOrders = completedOrders.slice(-20).reverse();

  return recentOrders.map((order) => {
    const statusColor = order.status === 'cancelled' ? '#dc3545' : '#28a745';
    const cardClass = order.status === 'cancelled' ? 'cancelled' : 'completed';

    return `
      <div class="order-card ${cardClass}">
        <div class="order-grid-completed" style="display: grid; grid-template-columns: 200px 1fr 200px; gap: 2rem; align-items: center;">
          <div>
            <h4 style="margin: 0; color: ${statusColor};">Order #${escapeHtml(order.orderNumber)}</h4>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">${escapeHtml(formatTime(order.createdAt))}</div>
          </div>

          <div style="font-size: 0.9rem; color: #666;">
            <strong>${escapeHtml(order.customerName)}</strong> • ${escapeHtml(order.orderType)} • ${order.items.length} items • <span style="text-transform: capitalize; color: ${statusColor}; font-weight: 700;">${escapeHtml(order.status)}</span>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: bold; color: ${statusColor};">$${order.totalPrice.toFixed(2)}</div>
            <button
              onclick="window.viewOrderDetails(${order.id})"
              style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ========================================
// API HELPERS
// ========================================
function getStoredAuth() {
  const token = localStorage.getItem('token');
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }

  return { token, user };
}

function handleAuthFailure(message = 'Unauthorized request. Please log in again if needed.') {
  const now = Date.now();

  if (authFailureHandled && now < suppressNextAuthWarningUntil) {
    return;
  }

  authFailureHandled = true;
  suppressNextAuthWarningUntil = now + 1500;

  console.error('❌ 401 Unauthorized');
  showNotification(message, 'warning');

  setTimeout(() => {
    authFailureHandled = false;
  }, 1500);
}

async function makeAuthenticatedRequest(url, options = {}) {
  const { token } = getStoredAuth();

  if (!token) {
    showNotification('Please log in again', 'warning');
    return null;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    handleAuthFailure('Order action unauthorized. Session may be expired or this route may not allow your token.');
    return null;
  }

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    throw new Error(
      errorData.error ||
      errorData.message ||
      `Request failed with status ${response.status}`
    );
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function loadOrdersFromBackend({ silent = false } = {}) {
  try {
    const { token, user } = getStoredAuth();

    if (!token) {
      if (!silent) showNotification('Please log in to view orders', 'warning');
      orders = [];
      return [];
    }

    if (user.role !== 'admin') {
      if (!silent) showNotification('Admin access required', 'error');
      orders = [];
      return [];
    }

    const result = await makeAuthenticatedRequest(`${API_BASE}/api/admin/admin/all`);

    if (!result) {
      orders = [];
      return [];
    }

    orders = normalizeOrders(result);
    return orders;
  } catch (error) {
    console.error('❌ Failed to load orders:', error);
    if (!silent) {
      showNotification(error.message || 'Failed to load orders', 'error');
    }
    orders = [];
    return [];
  }
}

// ========================================
// ORDER ACTIONS
// ========================================
function rerenderCurrentOrdersTab() {
  const ordersContent = document.getElementById('orders-content');
  if (!ordersContent || typeof window.switchOrderTab !== 'function') return;
  window.switchOrderTab(currentOrderTab);
}

async function changeOrderStatus(orderId, status, successMessage, type = 'success', selectEl = null) {
  const key = String(orderId);
  const previousValue = selectEl?.dataset.previousValue || selectEl?.value || '';

  if (activeStatusUpdates.has(key)) {
    if (selectEl && previousValue) {
      selectEl.value = previousValue;
    }
    return;
  }

  setOrderUpdating(orderId, true);
  rerenderCurrentOrdersTab();

  try {
    const result = await makeAuthenticatedRequest(`${API_BASE}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    if (!result) {
      if (selectEl && previousValue) {
        selectEl.value = previousValue;
      }
      return;
    }

    showNotification(successMessage, type);
    await refreshOrders(true);
  } catch (error) {
    console.error(`❌ Error updating order ${orderId}:`, error);
    if (selectEl && previousValue) {
      selectEl.value = previousValue;
    }
    showNotification(`Failed to update order: ${error.message}`, 'error');
  } finally {
    setOrderUpdating(orderId, false);
    rerenderCurrentOrdersTab();
  }
}

async function acceptOrder(orderId) {
  await changeOrderStatus(orderId, 'accepted', 'Order accepted successfully!', 'success');
}

async function rejectOrder(orderId) {
  if (!confirm('Are you sure you want to reject this order?')) return;
  await changeOrderStatus(orderId, 'cancelled', 'Order rejected', 'info');
}

async function updateOrderStatus(orderId, selectElOrStatus) {
  const selectEl = typeof selectElOrStatus === 'object' && selectElOrStatus?.value != null
    ? selectElOrStatus
    : null;

  const newStatus = selectEl ? selectEl.value : String(selectElOrStatus || '');
  const previousValue = orders.find((o) => o.id === orderId)?.status || 'accepted';

  if (selectEl) {
    selectEl.dataset.previousValue = previousValue;
  }

  await changeOrderStatus(
    orderId,
    newStatus,
    `Order status updated to ${newStatus}`,
    'success',
    selectEl
  );
}

function printOrder(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    showNotification('Order not found', 'error');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showNotification('Pop-up blocked. Please allow pop-ups for printing.', 'warning');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Order #${escapeHtml(order.orderNumber)} - Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          h1 { text-align: center; border-bottom: 3px solid #333; padding-bottom: 10px; }
          .order-info { margin: 20px 0; line-height: 1.8; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 5px 0; gap: 1rem; }
          .item-name { flex: 1; }
          .total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 1.2em; font-weight: bold; }
          .toppings { margin-left: 1rem; color: #666; font-size: 0.9em; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>ORDER RECEIPT #${escapeHtml(order.orderNumber)}</h1>
        <div class="order-info">
          <div><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
          <div><strong>Customer:</strong> ${escapeHtml(order.customerName)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>
          <div><strong>Type:</strong> ${escapeHtml(order.orderType.toUpperCase())}</div>
          <div><strong>Status:</strong> ${escapeHtml(order.status)}</div>
          ${order.orderType === 'delivery' && order.deliveryAddress ? `<div><strong>Address:</strong> ${escapeHtml(order.deliveryAddress)}</div>` : ''}
          ${order.deliveryInstructions ? `<div><strong>Instructions:</strong> ${escapeHtml(order.deliveryInstructions)}</div>` : ''}
        </div>
        <div class="items">
          <h2>Items:</h2>
          ${order.items.map((item) => `
            <div class="item">
              <span class="item-name">${item.quantity}x ${escapeHtml(item.name)} ${item.size ? `(${escapeHtml(item.size)})` : ''}</span>
              <span>$${item.subtotal.toFixed(2)}</span>
            </div>
            ${item.addedToppings?.length ? `<div class="toppings">+ Add: ${item.addedToppings.map((t) => escapeHtml(t.name || t)).join(', ')}</div>` : ''}
            ${item.removedToppings?.length ? `<div class="toppings">- Remove: ${item.removedToppings.map((t) => escapeHtml(t.name || t)).join(', ')}</div>` : ''}
          `).join('')}
        </div>
        <div class="total">
          <div class="item">
            <span>TOTAL:</span>
            <span>$${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Receipt</button>
      </body>
    </html>
  `);

  printWindow.document.close();
}

function viewOrderDetails(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    showNotification('Order not found', 'error');
    return;
  }

  alert(`
ORDER #${order.orderNumber} DETAILS

Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Type: ${order.orderType}
Status: ${order.status}
Payment: ${order.paymentMethod}
${order.deliveryAddress ? `Address: ${order.deliveryAddress}` : ''}

Items:
${order.items.map((item) =>
`- ${item.quantity}x ${item.name} ${item.size ? `(${item.size})` : ''} - $${item.subtotal.toFixed(2)}${
item.addedToppings?.length ? ` | Add: ${item.addedToppings.map((t) => t.name || t).join(', ')}` : ''
}${
item.removedToppings?.length ? ` | Remove: ${item.removedToppings.map((t) => t.name || t).join(', ')}` : ''
}`).join('\n')}

Total: $${order.totalPrice.toFixed(2)}
Created: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
  `.trim());
}

// ========================================
// NOTIFICATIONS
// ========================================
function showNotification(message, type = 'info') {
  const existing = document.getElementById('order-notification');
  if (existing) existing.remove();

  const colors = {
    success: '#28a745',
    error: '#dc3545',
    info: '#007bff',
    warning: '#ffc107'
  };

  const textColor = type === 'warning' ? '#333' : 'white';

  const notification = document.createElement('div');
  notification.id = 'order-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: ${textColor};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    font-weight: 600;
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
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ========================================
// REFRESH
// ========================================
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(async () => {
    await loadOrdersFromBackend({ silent: true });
    rerenderCurrentOrdersTab();
  }, 15000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

async function refreshOrders(silent = false) {
  await loadOrdersFromBackend({ silent });
  rerenderCurrentOrdersTab();
}

// ========================================
// INIT
// ========================================
export async function initOrdersPanel() {
  authFailureHandled = false;
  suppressNextAuthWarningUntil = 0;

  const { token, user } = getStoredAuth();

  if (!token || user.role !== 'admin') {
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

  window.switchOrderTab = (tab) => {
    currentOrderTab = tab;

    document.querySelectorAll('.order-tab').forEach((btn) => {
      btn.classList.remove('active');
      btn.style.background = 'transparent';
      btn.style.color = '#666';
      btn.style.borderBottomColor = 'transparent';
    });

    const activeBtn = Array.from(document.querySelectorAll('.order-tab')).find((btn) =>
      btn.getAttribute('onclick')?.includes(`'${tab}'`)
    );

    if (activeBtn) {
      const color = tab === 'new' ? '#ff6b35' : tab === 'progress' ? '#007bff' : '#28a745';
      activeBtn.classList.add('active');
      activeBtn.style.background = color;
      activeBtn.style.color = 'white';
      activeBtn.style.borderBottomColor = color;
    }

    const ordersContent = document.getElementById('orders-content');
    if (!ordersContent) return;

    const newOrdersHtml = renderNewOrders(getOrdersByTab('new'));
    const progressOrdersHtml = renderInProgressOrders(getOrdersByTab('progress'));
    const completedOrdersHtml = renderCompletedOrders(getOrdersByTab('completed'));

    ordersContent.innerHTML = `
      ${tab === 'new' ? newOrdersHtml : ''}
      ${tab === 'progress' ? progressOrdersHtml : ''}
      ${tab === 'completed' ? completedOrdersHtml : ''}
    `;
  };

  window.refreshOrders = refreshOrders;
  window.acceptOrder = acceptOrder;
  window.rejectOrder = rejectOrder;
  window.updateOrderStatus = updateOrderStatus;
  window.printOrder = printOrder;
  window.viewOrderDetails = viewOrderDetails;

  await loadOrdersFromBackend();
  startAutoRefresh();

  setTimeout(() => {
    rerenderCurrentOrdersTab();
  }, 50);
}

export function cleanupOrdersPanel() {
  stopAutoRefresh();
  activeStatusUpdates.clear();

  delete window.switchOrderTab;
  delete window.refreshOrders;
  delete window.acceptOrder;
  delete window.rejectOrder;
  delete window.updateOrderStatus;
  delete window.printOrder;
  delete window.viewOrderDetails;
}