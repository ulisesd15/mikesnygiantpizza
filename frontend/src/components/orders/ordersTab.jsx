// ordersTab.jsx

const API_BASE =
  import.meta?.env?.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'
    : '/api');

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatMoney(value) {
  return money.format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseJson(value, fallback = []) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function toValidDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatOrderDate(value) {
  const date = toValidDate(value);
  if (!date) return 'Unknown date';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getStatusInfo(status) {
  const key = String(status || 'pending').toLowerCase();

  const map = {
    pending: { bg: '#fff3cd', border: '#f59e0b', text: '#92400e', emoji: '⏳', label: 'Pending' },
    accepted: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', emoji: '👍', label: 'Accepted' },
    preparing: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', emoji: '👨‍🍳', label: 'Preparing' },
    ready: { bg: '#d1fae5', border: '#10b981', text: '#065f46', emoji: '✅', label: 'Ready' },
    out_for_delivery: { bg: '#e0f2fe', border: '#0891b2', text: '#0e7490', emoji: '🚚', label: 'Out for delivery' },
    delivered: { bg: '#d1fae5', border: '#10b981', text: '#065f46', emoji: '🚚', label: 'Delivered' },
    completed: { bg: '#d1fae5', border: '#10b981', text: '#065f46', emoji: '✅', label: 'Completed' },
    cancelled: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', emoji: '❌', label: 'Cancelled' }
  };

  return map[key] || map.pending;
}

function normalizeOrderItem(item = {}) {
  const menuItem = item.menuItem || item.MenuItem || {};

  const quantity = Number(item.quantity || 1);
  const price = Number(
    item.price ??
    item.unitPrice ??
    menuItem.price ??
    0
  );

  return {
    name: item.name || menuItem.name || 'Menu Item',
    size: item.size || menuItem.size || '',
    price,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1
  };
}

function normalizeOrder(order = {}) {
  const rawItems = order.items || order.orderItems || order.OrderItems || [];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : [];

  const computedTotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  return {
    id: order.id || '',
    orderNumber: order.orderNumber || order.id || `ORD-${Date.now()}`,
    userId: order.userId ?? order.UserId ?? order.user?.id ?? order.User?.id ?? '',
    customerName: order.customerName || order.user?.name || order.User?.name || 'Customer',
    customerEmail: order.customerEmail || order.user?.email || order.User?.email || '',
    customerPhone: order.customerPhone || order.phone || order.user?.phone || order.User?.phone || '',
    orderType: order.orderType || 'pickup',
    deliveryAddress: order.deliveryAddress || order.address || '',
    status: String(order.status || 'completed').toLowerCase(),
    total: Number(order.total ?? order.totalPrice ?? computedTotal ?? 0),
    createdAt: order.createdAt || order.updatedAt || new Date().toISOString(),
    items
  };
}

function renderStateCard({ icon, title, message, action, actionLabel, tone = 'neutral' }) {
  const tones = {
    neutral: {
      bg: '#ffffff',
      border: '#e5e7eb',
      title: '#111827',
      text: '#6b7280',
      button: '#ff6b35'
    },
    warning: {
      bg: '#fffbeb',
      border: '#fcd34d',
      title: '#92400e',
      text: '#92400e',
      button: '#2563eb'
    },
    danger: {
      bg: '#fef2f2',
      border: '#fca5a5',
      title: '#991b1b',
      text: '#991b1b',
      button: '#2563eb'
    }
  };

  const palette = tones[tone] || tones.neutral;

  return `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: ${palette.bg}; border-radius: 14px; border: 1px solid ${palette.border};">
      <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
      <h3 style="color: ${palette.title}; margin: 0 0 0.5rem;">${escapeHtml(title)}</h3>
      <p style="color: ${palette.text}; margin: 0 0 1.5rem;">${escapeHtml(message)}</p>
      ${
        action && actionLabel
          ? `
            <button
              data-action="${escapeHtml(action)}"
              style="background: ${palette.button}; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 1rem; cursor: pointer; font-weight: 700;"
            >
              ${escapeHtml(actionLabel)}
            </button>
          `
          : ''
      }
    </div>
  `;
}

// VIEW SHELL
export function renderOrdersTab() {
  return `
    <div id="orders-tab" class="tab-content" style="display: none;">
      <div>
      </div>

      <div
        id="orders-grid"
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.25rem;"
      >
        <div style="text-align: center; padding: 3rem; color: #666;">Loading orders... 🍕</div>
      </div>
    </div>
  `;
}

// RENDER LIST
export function renderOrders(orders) {
  const container = document.getElementById('orders-grid');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = renderStateCard({
      icon: '🍕',
      title: 'No orders yet',
      message: 'Start by ordering something from the menu.',
      action: 'showMenu',
      actionLabel: 'Browse Menu'
    });
    return;
  }

  container.innerHTML = orders.map((order) => orderCard(order)).join('');
}

// CARD
export function orderCard(order) {
  const safeOrder = normalizeOrder(order);
  const statusInfo = getStatusInfo(safeOrder.status);
  const formattedDate = formatOrderDate(safeOrder.createdAt);

  return `
    <div
      class="menu-card"
      style="background: white; border: 1px solid #e5e7eb; border-top: 5px solid ${statusInfo.border}; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 1.25rem;"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div>
          <h3 style="margin: 0; color: #111827; font-size: 1.15rem;">Order #${escapeHtml(safeOrder.orderNumber)}</h3>
          <p style="color: #6b7280; margin: 0.3rem 0 0; font-size: 0.9rem;">${escapeHtml(formattedDate)}</p>
        </div>

        <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 0.5rem 0.9rem; border-radius: 999px; font-weight: 700; font-size: 0.82rem; border: 1px solid ${statusInfo.border};">
          ${statusInfo.emoji} ${escapeHtml(statusInfo.label)}
        </div>
      </div>

      <div style="background: #f8fafc; padding: 0.8rem 1rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid #eef2f7;">
        <div style="font-weight: 700; color: #374151; font-size: 0.95rem;">
          ${safeOrder.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
        </div>
        ${
          safeOrder.orderType === 'delivery' && safeOrder.deliveryAddress
            ? `<div style="font-size: 0.88rem; color: #6b7280; margin-top: 0.35rem;">${escapeHtml(safeOrder.deliveryAddress)}</div>`
            : ''
        }
      </div>

      <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid #eef2f7;">
        <h4 style="margin: 0 0 0.75rem; font-size: 0.92rem; color: #4b5563;">Order Items</h4>
        ${
          safeOrder.items.length
            ? safeOrder.items.map((item, index) => `
              <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; ${index < safeOrder.items.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                <div style="flex: 1; min-width: 0;">
                  <span style="font-weight: 700; color: #111827;">🍕 ${escapeHtml(item.name)}</span>
                  ${item.size ? `<span style="color: #6b7280; font-size: 0.85rem;"> (${escapeHtml(item.size)})</span>` : ''}
                  <span style="color: #9ca3af; font-size: 0.85rem;"> x${item.quantity}</span>
                </div>
                <span style="font-weight: 700; color: #16a34a; white-space: nowrap;">${formatMoney(item.price * item.quantity)}</span>
              </div>
            `).join('')
            : '<p style="color: #9ca3af; font-style: italic; margin: 0;">No items found</p>'
        }
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
        <span style="font-weight: 700; font-size: 1rem; color: #111827;">Total</span>
        <span style="font-weight: 800; font-size: 1.25rem; color: #16a34a;">${formatMoney(safeOrder.total)}</span>
      </div>

      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; font-size: 0.88rem; color: #6b7280;">
        <div>👤 ${escapeHtml(safeOrder.customerName)}</div>
        ${safeOrder.customerEmail ? `<div>📧 ${escapeHtml(safeOrder.customerEmail)}</div>` : ''}
        ${safeOrder.customerPhone ? `<div>📞 ${escapeHtml(safeOrder.customerPhone)}</div>` : ''}
      </div>
    </div>
  `;
}

// DATA ACCESS
function getUserOrders(userId) {
  try {
    const storage = getStorage();
    const ordersData = storage?.getItem('pizzaOrders');
    if (!ordersData) return [];

    const allOrders = parseJson(ordersData, []);
    if (!Array.isArray(allOrders)) return [];

    const normalizedUserId = String(userId);

    const userOrders = allOrders.filter((order) => {
      const orderUserId =
        order?.userId ??
        order?.UserId ??
        order?.user?.id ??
        order?.User?.id;

      return String(orderUserId) === normalizedUserId;
    });

    return userOrders.map(normalizeOrder);
  } catch (error) {
    console.error('❌ Error parsing local orders:', error);
    return [];
  }
}

async function fetchUserOrders() {
  const storage = getStorage();
  const token = storage?.getItem('token');

  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE}/orders/my-orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `API Error: ${response.status}`;

    if (response.status === 401) {
      throw new Error('Please log in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not allowed to view these orders.');
    }

    if (response.status === 404) {
      throw new Error('Orders route not found.');
    }

    throw new Error(message);
  }

  const orders =
    payload?.orders ||
    payload?.data?.orders ||
    payload?.data ||
    [];

  return Array.isArray(orders) ? orders.map(normalizeOrder) : [];
}

// INTERACTION WIRING
function attachEventListeners(container) {
  container.querySelector('[data-action="showAuth"]')?.addEventListener('click', () => {
    if (typeof window.showAuth === 'function') {
      window.showAuth();
    }
  });

  container.querySelector('[data-action="showMenu"]')?.addEventListener('click', () => {
    if (typeof window.showTab === 'function') {
      window.showTab('menu');
    }
  });

  container.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
    loadOrders();
  });
}

// STARTUP
export async function loadOrders() {
  console.log('📋 Loading user orders...');

  const ordersGrid = document.getElementById('orders-grid');
  if (!ordersGrid) {
    console.warn('⚠️ Orders grid not found');
    return;
  }

  if (!window.currentUser?.id) {
    ordersGrid.innerHTML = renderStateCard({
      icon: '🔒',
      title: 'Login required',
      message: 'Please login to view your order history.',
      action: 'showAuth',
      actionLabel: 'Login / Register',
      tone: 'warning'
    });
    attachEventListeners(ordersGrid);
    return;
  }

  ordersGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🍕</div>
      <p>Loading your orders...</p>
    </div>
  `;

  try {
    const apiOrders = await fetchUserOrders().catch((error) => {
      console.warn('API fetch failed, using local fallback:', error);
      return [];
    });

    const fallbackOrders = getUserOrders(window.currentUser.id);
    const orders = apiOrders.length > 0 ? apiOrders : fallbackOrders;

    console.log(`✅ Loaded ${orders.length} orders for user ${window.currentUser.email || window.currentUser.id}`);

    if (orders.length === 0) {
      ordersGrid.innerHTML = renderStateCard({
        icon: '🍕',
        title: 'No orders yet',
        message: 'Start by ordering something delicious.',
        action: 'showMenu',
        actionLabel: 'Browse Menu'
      });
    } else {
      const sortedOrders = [...orders].sort((a, b) => {
        const aTime = toValidDate(a.createdAt)?.getTime() || 0;
        const bTime = toValidDate(b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      });

      renderOrders(sortedOrders);
    }

    attachEventListeners(ordersGrid);
  } catch (error) {
    console.error('❌ Failed to load orders:', error);

    ordersGrid.innerHTML = renderStateCard({
      icon: '⚠️',
      title: 'Error loading orders',
      message: error.message || 'Something went wrong while loading your orders.',
      action: 'retry',
      actionLabel: 'Retry',
      tone: 'danger'
    });

    attachEventListeners(ordersGrid);
  }
}

let ordersTabInitialized = false;

export function initOrdersTab() {
  console.log('📋 Initializing Orders Tab...');

  if (!ordersTabInitialized) {
    ordersTabInitialized = true;

    window.addEventListener('authChanged', () => {
      console.log('🔄 Auth changed, refreshing orders...');
      loadOrders();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOrders, { once: true });
  } else {
    setTimeout(loadOrders, 100);
  }

  console.log('✅ Orders Tab initialized');
}

window.ordersTab = { loadOrders, initOrdersTab };