// frontend/components/adminPanel.js
import { showToast } from '../cart/cartStore.js';
import { renderOrdersPanel, initOrdersPanel } from './OrdersPanel.jsx';

let currentAdminSection = 'dashboard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DEFAULT_VARIANTS_BY_CATEGORY = {
  pizza: [
    { label: 'Small', priceOffset: 0 },
    { label: 'Medium', priceOffset: 2 },
    { label: 'Large', priceOffset: 4 },
    { label: 'X-Large', priceOffset: 6 }
  ],
  salad: [
    { label: 'Small', priceOffset: 0 },
    { label: 'Large', priceOffset: 3 }
  ],
  wings: [
    { label: '6 Pc', priceOffset: 0 },
    { label: '12 Pc', priceOffset: 6 },
    { label: '24 Pc', priceOffset: 14 }
  ]
};

const GROUPED_CARD_CATEGORIES = new Set(['pizza', 'salad', 'wings']);

const DEFAULT_BASE_TOPPINGS_BY_CATEGORY = {
  pizza: ['Cheese', 'Pizza Sauce'],
  salad: ['Lettuce'],
  wings: []
};

const DEFAULT_ADDON_TOPPINGS_BY_CATEGORY = {
  pizza: [
    { name: 'Pepperoni', price: 2 },
    { name: 'Sausage', price: 2 },
    { name: 'Mushrooms', price: 1.5 },
    { name: 'Onions', price: 1.25 },
    { name: 'Bell Peppers', price: 1.5 },
    { name: 'Black Olives', price: 1.5 },
    { name: 'Extra Cheese', price: 2.5 }
  ],
  salad: [
    { name: 'Grilled Chicken', price: 4 },
    { name: 'Avocado', price: 2.5 },
    { name: 'Bacon', price: 2.5 },
    { name: 'Extra Cheese', price: 1.5 }
  ],
  wings: [
    { name: 'Ranch', price: 0.75 },
    { name: 'Blue Cheese', price: 0.75 },
    { name: 'Extra Sauce', price: 1.25 }
  ]
};

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatRelativeOrderTime(timestamp) {
  if (!timestamp) return 'Unknown time';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

function getPayloadData(payload, fallback = null) {
  if (payload == null) return fallback;
  if (payload.data != null) return payload.data;
  return payload;
}

function normalizeMenuItems(payload) {
  const data = getPayloadData(payload, []);
  return Array.isArray(data) ? data : [];
}

function normalizeDashboardStats(payload) {
  const data = getPayloadData(payload, {});
  const orders = data.orders || data || {};

  return {
    today: Number(orders.today || orders.ordersToday || 0),
    revenueToday: Number(orders.revenueToday || 0),
    active: Number(orders.active || orders.activeOrders || 0),
    pending: Number(orders.pending || 0)
  };
}

function normalizeMenuItem(payload) {
  const item = getPayloadData(payload, null);
  return item && typeof item === 'object' ? item : null;
}

function getRecentOrderItems(order) {
  return order?.OrderItems || order?.orderItems || order?.items || [];
}

function normalizeRecentOrder(order = {}) {
  const items = getRecentOrderItems(order);
  const derivedTotal = items.reduce((sum, item) => {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(
      item?.price ??
      item?.unitPrice ??
      item?.menuItem?.price ??
      item?.MenuItem?.price ??
      0
    );
    return sum + quantity * unitPrice;
  }, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    customerName:
      order.customerName ||
      order.User?.name ||
      order.user?.name ||
      'Guest',
    totalPrice: Number(order.totalPrice ?? order.total ?? derivedTotal ?? 0),
    status: order.status || 'pending',
    createdAt: order.createdAt || null,
    orderType: order.orderType || 'pickup',
    itemCount: items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
  };
}

function getStatusColor(status) {
  const colors = {
    pending: '#ea580c',
    accepted: '#2563eb',
    preparing: '#d97706',
    ready: '#16a34a',
    completed: '#6b7280',
    cancelled: '#dc2626'
  };

  return colors[status] || '#6b7280';
}

function normalizeCategory(category) {
  return String(category || '').trim().toLowerCase();
}

function isGroupedCategory(category) {
  return GROUPED_CARD_CATEGORIES.has(normalizeCategory(category));
}

function normalizeGroupKey(item) {
  const category = normalizeCategory(item?.category);
  const name = String(item?.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${category}::${name}`;
}

function getSizeRank(size) {
  const normalized = String(size || '').trim().toLowerCase();
  const rank = {
    small: 1,
    medium: 2,
    large: 3,
    'x-large': 4,
    'x large': 4,
    xl: 4,
    '6 pc': 10,
    '12 pc': 11,
    '24 pc': 12
  };
  return rank[normalized] || 999;
}

function groupAdminMenuItems(items = []) {
  const grouped = [];
  const groupMap = new Map();

  items.forEach((item) => {
    if (!isGroupedCategory(item.category)) {
      grouped.push({ type: 'single', item });
      return;
    }

    const key = normalizeGroupKey(item);

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        type: 'variant-group',
        key,
        name: item.name,
        category: item.category,
        description: item.description || '',
        variants: []
      });
      grouped.push(groupMap.get(key));
    }

    const group = groupMap.get(key);
    group.variants.push(item);

    if (!group.description && item.description) {
      group.description = item.description;
    }
  });

  grouped.forEach((entry) => {
    if (entry.type === 'variant-group') {
      entry.variants.sort((a, b) => getSizeRank(a.size) - getSizeRank(b.size));
      entry.isAvailable = entry.variants.some((variant) => !!variant.isAvailable);
      entry.minPrice = Math.min(...entry.variants.map((variant) => Number(variant.price || 0)));
      entry.maxPrice = Math.max(...entry.variants.map((variant) => Number(variant.price || 0)));
      entry.primaryVariantId = entry.variants[0]?.id || null;
    }
  });

  return grouped;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDefaultVariantsForCategory(category, basePrice = 0) {
  const normalized = normalizeCategory(category);
  const preset = DEFAULT_VARIANTS_BY_CATEGORY[normalized];

  if (Array.isArray(preset) && preset.length) {
    return preset.map((entry) => ({
      label: entry.label,
      price: Number((Number(basePrice || 0) + Number(entry.priceOffset || 0)).toFixed(2))
    }));
  }

  return [{ label: '', price: Number(basePrice || 0) }];
}

function getDefaultBaseToppingsForCategory(category) {
  const normalized = normalizeCategory(category);
  return (DEFAULT_BASE_TOPPINGS_BY_CATEGORY[normalized] || []).map((name) => ({
    name,
    removable: true
  }));
}

function getDefaultAddonToppingsForCategory(category) {
  const normalized = normalizeCategory(category);
  return (DEFAULT_ADDON_TOPPINGS_BY_CATEGORY[normalized] || []).map((entry) => ({
    name: entry.name,
    price: Number(entry.price || 0)
  }));
}

function renderRecentOrdersLoading() {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  container.innerHTML = `
    <div style="display: grid; gap: 0.75rem;">
      ${Array.from({ length: 4 }).map(() => `
        <div style="height: 72px; border-radius: 10px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: dashboardShimmer 1.4s infinite;"></div>
      `).join('')}
    </div>
  `;
}

function renderRecentOrdersError(message = 'Failed to load recent orders') {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; border-radius: 12px;">
      <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">⚠️</div>
      <div style="font-weight: 700; margin-bottom: 0.35rem;">Could not load recent orders</div>
      <div style="font-size: 0.95rem;">${escapeHtml(message)}</div>
      <button onclick="window.refreshDashboard()" style="margin-top: 1rem; padding: 0.7rem 1rem; background: #991b1b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Try Again
      </button>
    </div>
  `;
}

async function loadDashboardStats() {
  const ordersTodayEl = document.getElementById('stat-orders-today');
  const revenueTodayEl = document.getElementById('stat-revenue-today');
  const activeOrdersEl = document.getElementById('stat-active-orders');
  const pendingOrdersEl = document.getElementById('stat-pending-orders');
  const menuItemsEl = document.getElementById('stat-menu-items');

  const statEls = [
    ordersTodayEl,
    revenueTodayEl,
    activeOrdersEl,
    pendingOrdersEl,
    menuItemsEl
  ].filter(Boolean);

  try {
    const token = getToken();

    statEls.forEach((el) => {
      el.textContent = '...';
    });

    renderRecentOrdersLoading();

    if (!token) {
      console.error('❌ Please log in again');
      if (ordersTodayEl) ordersTodayEl.textContent = '—';
      if (revenueTodayEl) revenueTodayEl.textContent = formatCurrency(0);
      if (activeOrdersEl) activeOrdersEl.textContent = '—';
      if (pendingOrdersEl) pendingOrdersEl.textContent = '—';
      if (menuItemsEl) menuItemsEl.textContent = '—';
      renderRecentOrdersError('Please log in again.');
      return;
    }

    const [statsRes, menuRes, recentOrdersRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      }),
      fetch(`${API_BASE}/api/menu`, {
        method: 'GET',
        headers: getAuthHeaders()
      }),
      fetch(`${API_BASE}/api/admin/admin/all?limit=5`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
    ]);

    if (!statsRes.ok) {
      const error = await safeJson(statsRes);
      throw new Error(`Stats API Error (${statsRes.status}): ${error?.error || 'Unknown error'}`);
    }

    if (!menuRes.ok) {
      const error = await safeJson(menuRes);
      throw new Error(`Menu API Error (${menuRes.status}): ${error?.error || 'Unknown error'}`);
    }

    const statsPayload = await safeJson(statsRes);
    const menuPayload = await safeJson(menuRes);
    const recentOrdersPayload = recentOrdersRes.ok ? await safeJson(recentOrdersRes) : null;

    const stats = normalizeDashboardStats(statsPayload);
    const menuItems = normalizeMenuItems(menuPayload);

    const recentOrdersRaw =
      getPayloadData(recentOrdersPayload, {})?.orders ||
      getPayloadData(recentOrdersPayload, []) ||
      [];

    const recentOrders = Array.isArray(recentOrdersRaw)
      ? recentOrdersRaw.slice(0, 5).map(normalizeRecentOrder)
      : [];

    if (ordersTodayEl) ordersTodayEl.textContent = String(stats.today);
    if (revenueTodayEl) revenueTodayEl.textContent = formatCurrency(stats.revenueToday);
    if (activeOrdersEl) activeOrdersEl.textContent = String(stats.active);
    if (pendingOrdersEl) pendingOrdersEl.textContent = String(stats.pending);
    if (menuItemsEl) menuItemsEl.textContent = String(menuItems.length);

    renderRecentOrders(recentOrders);
  } catch (error) {
    console.error('❌ Failed to load dashboard stats:', error.message);
    if (ordersTodayEl) ordersTodayEl.textContent = '⚠️';
    if (revenueTodayEl) revenueTodayEl.textContent = '⚠️';
    if (activeOrdersEl) activeOrdersEl.textContent = '⚠️';
    if (pendingOrdersEl) pendingOrdersEl.textContent = '⚠️';
    if (menuItemsEl) menuItemsEl.textContent = '⚠️';
    renderRecentOrdersError(error.message || 'Failed to load dashboard data');
  }
}

window.refreshDashboard = async () => {
  await loadDashboardStats();
  showToast('Dashboard refreshed!');
};

function variantRowTemplate(variant = {}) {
  return `
    <div class="variant-row" style="display:grid; grid-template-columns: 1.1fr 1fr auto; gap:0.75rem; align-items:center; margin-bottom:0.75rem;">
      <input
        class="admin-panel-input variant-label"
        placeholder="Size / Portion"
        value="${escapeHtml(variant.label || '')}"
        style="width:100%; padding:0.8rem; border:2px solid #e5e7eb; border-radius:10px; font-size:0.95rem;"
      >
      <input
        class="admin-panel-input variant-price"
        type="number"
        step="0.01"
        placeholder="Price"
        value="${escapeHtml(variant.price ?? '')}"
        style="width:100%; padding:0.8rem; border:2px solid #e5e7eb; border-radius:10px; font-size:0.95rem;"
      >
      <button
        type="button"
        class="remove-variant-btn admin-action-btn"
        style="padding:0.8rem 0.9rem; background:#dc2626; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;"
      >
        ✕
      </button>
    </div>
  `;
}

function toppingRowTemplate(topping = {}, mode = 'base') {
  const showPrice = mode === 'addon';

  return `
    <div class="topping-row" data-mode="${escapeHtml(mode)}" style="display:grid; grid-template-columns: 1.4fr ${showPrice ? '0.8fr' : ''} auto; gap:0.75rem; align-items:center; margin-bottom:0.75rem;">
      <input
        class="admin-panel-input topping-name"
        placeholder="${mode === 'base' ? 'Base topping name' : 'Add-on topping name'}"
        value="${escapeHtml(topping.name || '')}"
        style="width:100%; padding:0.8rem; border:2px solid #e5e7eb; border-radius:10px; font-size:0.95rem;"
      >
      ${showPrice ? `
        <input
          class="admin-panel-input topping-price"
          type="number"
          step="0.01"
          placeholder="Price"
          value="${escapeHtml(topping.price ?? '')}"
          style="width:100%; padding:0.8rem; border:2px solid #e5e7eb; border-radius:10px; font-size:0.95rem;"
        >
      ` : ''}
      <button
        type="button"
        class="remove-topping-btn admin-action-btn"
        style="padding:0.8rem 0.9rem; background:#dc2626; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;"
      >
        ✕
      </button>
    </div>
  `;
}

function getVariantsContainer() {
  return document.getElementById('item-variants-list');
}

function getBaseToppingsContainer() {
  return document.getElementById('item-base-toppings-list');
}

function getAddonToppingsContainer() {
  return document.getElementById('item-addon-toppings-list');
}

function addVariantRow(variant = {}) {
  const container = getVariantsContainer();
  if (!container) return;
  container.insertAdjacentHTML('beforeend', variantRowTemplate(variant));
}

function addBaseToppingRow(topping = {}) {
  const container = getBaseToppingsContainer();
  if (!container) return;
  container.insertAdjacentHTML('beforeend', toppingRowTemplate(topping, 'base'));
}

function addAddonToppingRow(topping = {}) {
  const container = getAddonToppingsContainer();
  if (!container) return;
  container.insertAdjacentHTML('beforeend', toppingRowTemplate(topping, 'addon'));
}

function clearDynamicFormSections() {
  const variants = getVariantsContainer();
  const baseToppings = getBaseToppingsContainer();
  const addonToppings = getAddonToppingsContainer();

  if (variants) variants.innerHTML = '';
  if (baseToppings) baseToppings.innerHTML = '';
  if (addonToppings) addonToppings.innerHTML = '';
}

function collectVariantsFromForm() {
  const container = getVariantsContainer();
  if (!container) return [];

  return Array.from(container.querySelectorAll('.variant-row'))
    .map((row) => {
      const label = row.querySelector('.variant-label')?.value.trim() || '';
      const priceRaw = row.querySelector('.variant-price')?.value;
      const price = parseFloat(priceRaw || '0');

      return {
        label,
        price
      };
    })
    .filter((variant) => variant.label && Number.isFinite(variant.price) && variant.price > 0);
}

function collectBaseToppingsFromForm() {
  const container = getBaseToppingsContainer();
  if (!container) return [];

  return Array.from(container.querySelectorAll('.topping-row'))
    .map((row) => ({
      name: row.querySelector('.topping-name')?.value.trim() || '',
      removable: true
    }))
    .filter((topping) => topping.name);
}

function collectAddonToppingsFromForm() {
  const container = getAddonToppingsContainer();
  if (!container) return [];

  return Array.from(container.querySelectorAll('.topping-row'))
    .map((row) => ({
      name: row.querySelector('.topping-name')?.value.trim() || '',
      price: parseFloat(row.querySelector('.topping-price')?.value || '0')
    }))
    .filter((topping) => topping.name);
}

function getCurrentMenuFormValues() {
  return {
    name: document.getElementById('item-name')?.value.trim() || '',
    basePrice: parseFloat(document.getElementById('item-price')?.value || '0'),
    category: document.getElementById('item-category')?.value || 'pizza',
    description: document.getElementById('item-desc')?.value.trim() || null,
    isAvailable: !!document.getElementById('item-available')?.checked,
    variants: collectVariantsFromForm(),
    baseToppings: collectBaseToppingsFromForm(),
    addonToppings: collectAddonToppingsFromForm()
  };
}

function fillDynamicFormForCategory(category, basePrice = 0, forceReset = false) {
  const variants = collectVariantsFromForm();
  const baseToppings = collectBaseToppingsFromForm();
  const addonToppings = collectAddonToppingsFromForm();

  const shouldReplaceVariants = forceReset || variants.length === 0;
  const shouldReplaceBaseToppings = forceReset || baseToppings.length === 0;
  const shouldReplaceAddonToppings = forceReset || addonToppings.length === 0;

  if (shouldReplaceVariants) {
    const container = getVariantsContainer();
    if (container) {
      container.innerHTML = '';
      getDefaultVariantsForCategory(category, basePrice).forEach(addVariantRow);
    }
  }

  if (shouldReplaceBaseToppings) {
    const container = getBaseToppingsContainer();
    if (container) {
      container.innerHTML = '';
      getDefaultBaseToppingsForCategory(category).forEach(addBaseToppingRow);
    }
  }

  if (shouldReplaceAddonToppings) {
    const container = getAddonToppingsContainer();
    if (container) {
      container.innerHTML = '';
      getDefaultAddonToppingsForCategory(category).forEach(addAddonToppingRow);
    }
  }
}

function resetMenuFormState() {
  const form = document.getElementById('menu-form');
  if (!form) return;

  form.reset();
  clearDynamicFormSections();

  const category = document.getElementById('item-category')?.value || 'pizza';
  const basePrice = parseFloat(document.getElementById('item-price')?.value || '0') || 0;

  fillDynamicFormForCategory(category, basePrice, true);

  const submitBtn = form.querySelector('button[type="submit"]');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  if (submitBtn) {
    submitBtn.textContent = '➕ Add Item';
    delete submitBtn.dataset.editing;
    delete submitBtn.dataset.editingGroup;
  }

  if (cancelBtn) cancelBtn.style.display = 'none';

  syncDynamicFormHints();
}

async function tryPersistModifiersForItem(menuItemId, modifiers = {}) {
  const baseToppings = Array.isArray(modifiers.baseToppings) ? modifiers.baseToppings : [];
  const addonToppings = Array.isArray(modifiers.addonToppings) ? modifiers.addonToppings : [];

  if (!menuItemId || (!baseToppings.length && !addonToppings.length)) return { saved: false };

  const payload = {
    menuItemId,
    mandatory: baseToppings.map((item) => ({
      name: item.name,
      removable: true
    })),
    optional: addonToppings.map((item) => ({
      name: item.name,
      price: Number(item.price || 0)
    }))
  };

  const candidateEndpoints = [
    `${API_BASE}/api/menu/${menuItemId}/customization`,
    `${API_BASE}/api/menu/${menuItemId}/modifiers`,
    `${API_BASE}/api/menu/customization`,
    `${API_BASE}/api/menu/modifiers`
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        return { saved: true, endpoint };
      }
    } catch {
      // continue trying
    }
  }

  return { saved: false };
}

async function createMenuVariantsAndModifiers(formValues) {
  const {
    name,
    category,
    description,
    isAvailable,
    variants,
    baseToppings,
    addonToppings
  } = formValues;

  const effectiveVariants = variants.length
    ? variants
    : [{ label: '', price: formValues.basePrice }];

  const createdItems = [];

  for (const variant of effectiveVariants) {
    const payload = {
      name,
      price: Number(variant.price),
      category,
      size: variant.label || null,
      description,
      isAvailable
    };

    const res = await fetch(`${API_BASE}/api/menu`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await safeJson(res);
      throw new Error(error?.error || `Failed to add ${variant.label || 'item'}`);
    }

    const createdPayload = await safeJson(res);
    const createdItem = normalizeMenuItem(createdPayload) || createdPayload?.data || createdPayload || null;

    if (createdItem?.id) {
      createdItems.push(createdItem);
      await tryPersistModifiersForItem(createdItem.id, { baseToppings, addonToppings });
    }
  }

  return createdItems;
}

async function addMenuItem(e) {
  e.preventDefault();

  if (!window.currentUser || window.currentUser.role !== 'admin') {
    showToast('Admin access required!', 'error');
    return;
  }

  const formValues = getCurrentMenuFormValues();

  if (!formValues.name || Number.isNaN(formValues.basePrice) || formValues.basePrice <= 0) {
    showToast('Please fill name and valid base price', 'error');
    return;
  }

  if (!formValues.variants.length) {
    showToast('Please add at least one size or portion with a valid price', 'error');
    return;
  }

  try {
    const createdItems = await createMenuVariantsAndModifiers(formValues);

    if (window.loadMenu) window.loadMenu();
    await loadAdminMenu();
    resetMenuFormState();

    const normalizedCategory = normalizeCategory(formValues.category);
    const grouped = isGroupedCategory(normalizedCategory);

    showToast(
      grouped
        ? `✅ ${formValues.name} added with ${createdItems.length} variant${createdItems.length === 1 ? '' : 's'}`
        : '✅ Item added successfully!'
    );
  } catch (error) {
    console.error('Add menu item failed:', error);
    showToast(error.message || 'Network error - try again', 'error');
  }
}

export async function loadAdminMenu() {
  const grid = document.getElementById('admin-menu-grid');

  if (!window.currentUser || window.currentUser.role !== 'admin') {
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #dc3545;">🔐 Admin access required</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/menu`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load menu');
    }

    const payload = await safeJson(res);
    const items = normalizeMenuItems(payload);
    renderAdminMenuGrid(items);
  } catch (error) {
    console.error('Load admin menu failed:', error);
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">⚠️ Failed to load menu</div>';
    }
  }
}

window.editMenuItem = async (itemId) => {
  try {
    const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to fetch item');
    }

    const payload = await safeJson(res);
    const item = normalizeMenuItem(payload);

    if (!item) {
      throw new Error('Invalid item payload');
    }

    if (currentAdminSection !== 'menu') {
      await window.switchAdminSection('menu');
    }

    setTimeout(() => {
      const nameEl = document.getElementById('item-name');
      const priceEl = document.getElementById('item-price');
      const categoryEl = document.getElementById('item-category');
      const descEl = document.getElementById('item-desc');
      const availableEl = document.getElementById('item-available');

      if (nameEl) nameEl.value = item.name || '';
      if (priceEl) priceEl.value = item.price ?? '';
      if (categoryEl) categoryEl.value = item.category || 'pizza';
      if (descEl) descEl.value = item.description || '';
      if (availableEl) availableEl.checked = !!item.isAvailable;

      clearDynamicFormSections();
      addVariantRow({
        label: item.size || '',
        price: item.price ?? ''
      });

      const submitBtn = document.querySelector('#menu-form button[type="submit"]');
      const cancelBtn = document.getElementById('cancel-edit-btn');

      if (submitBtn) {
        submitBtn.textContent = '💾 Update Item';
        submitBtn.dataset.editing = String(itemId);
        delete submitBtn.dataset.editingGroup;
      }

      if (cancelBtn) cancelBtn.style.display = 'block';

      syncDynamicFormHints();
      document.getElementById('menu-form')?.scrollIntoView({ behavior: 'smooth' });
      showToast(`Editing: ${item.name}`);
    }, 100);
  } catch (error) {
    console.error('Edit menu item failed:', error);
    showToast('Failed to load item', 'error');
  }
};

window.editGroupedMenuItem = async (groupName, category) => {
  try {
    const res = await fetch(`${API_BASE}/api/menu`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load grouped item');
    }

    const payload = await safeJson(res);
    const items = normalizeMenuItems(payload);

    const matching = items
      .filter((item) =>
        normalizeCategory(item.category) === normalizeCategory(category) &&
        String(item.name || '').trim().toLowerCase() === String(groupName || '').trim().toLowerCase()
      )
      .sort((a, b) => getSizeRank(a.size) - getSizeRank(b.size));

    if (!matching.length) {
      throw new Error('No matching variants found');
    }

    if (currentAdminSection !== 'menu') {
      await window.switchAdminSection('menu');
    }

    setTimeout(() => {
      const first = matching[0];
      const nameEl = document.getElementById('item-name');
      const priceEl = document.getElementById('item-price');
      const categoryEl = document.getElementById('item-category');
      const descEl = document.getElementById('item-desc');
      const availableEl = document.getElementById('item-available');

      if (nameEl) nameEl.value = first.name || '';
      if (priceEl) priceEl.value = first.price ?? '';
      if (categoryEl) categoryEl.value = first.category || 'pizza';
      if (descEl) descEl.value = first.description || '';
      if (availableEl) availableEl.checked = matching.some((item) => !!item.isAvailable);

      clearDynamicFormSections();
      matching.forEach((item) => {
        addVariantRow({
          label: item.size || '',
          price: item.price ?? ''
        });
      });

      const submitBtn = document.querySelector('#menu-form button[type="submit"]');
      const cancelBtn = document.getElementById('cancel-edit-btn');

      if (submitBtn) {
        submitBtn.textContent = '💾 Update Group';
        submitBtn.dataset.editingGroup = JSON.stringify({
          name: first.name,
          category: first.category
        });
        delete submitBtn.dataset.editing;
      }

      if (cancelBtn) cancelBtn.style.display = 'block';

      syncDynamicFormHints();
      document.getElementById('menu-form')?.scrollIntoView({ behavior: 'smooth' });
      showToast(`Editing group: ${first.name}`);
    }, 100);
  } catch (error) {
    console.error('Edit grouped menu item failed:', error);
    showToast(error.message || 'Failed to load grouped item', 'error');
  }
};

window.cancelEditMenuItem = () => {
  resetMenuFormState();
};

window.deleteMenuItem = async (itemId) => {
  if (!confirm('Delete this menu item? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Delete failed');
    }

    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();
    showToast('🗑️ Item deleted successfully');
  } catch (error) {
    console.error('Delete menu item failed:', error);
    showToast('Delete failed', 'error');
  }
};

window.deleteGroupedMenuItem = async (groupName, category) => {
  if (!confirm(`Delete all ${groupName} ${category} variants? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/menu`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load menu before delete');
    }

    const payload = await safeJson(res);
    const items = normalizeMenuItems(payload);
    const matching = items.filter((item) =>
      normalizeCategory(item.category) === normalizeCategory(category) &&
      String(item.name || '').trim().toLowerCase() === String(groupName || '').trim().toLowerCase()
    );

    for (const item of matching) {
      const delRes = await fetch(`${API_BASE}/api/menu/${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!delRes.ok) {
        throw new Error(`Failed deleting ${item.size || item.name}`);
      }
    }

    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();
    showToast(`🗑️ Deleted ${matching.length} variant${matching.length === 1 ? '' : 's'}`);
  } catch (error) {
    console.error('Delete grouped menu item failed:', error);
    showToast(error.message || 'Delete failed', 'error');
  }
};

window.toggleItemAvailability = async (itemId, isAvailable) => {
  try {
    const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAvailable })
    });

    if (!res.ok) {
      throw new Error('Update failed');
    }

    showToast(isAvailable ? '✅ Item is now available' : '⏸️ Item is now hidden');
    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();
  } catch (error) {
    console.error('Toggle item availability failed:', error);
    showToast('Update failed', 'error');
  }
};

window.toggleGroupedAvailability = async (groupName, category, isAvailable) => {
  try {
    const res = await fetch(`${API_BASE}/api/menu`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load group items');
    }

    const payload = await safeJson(res);
    const items = normalizeMenuItems(payload);

    const matching = items.filter((item) =>
      normalizeCategory(item.category) === normalizeCategory(category) &&
      String(item.name || '').trim().toLowerCase() === String(groupName || '').trim().toLowerCase()
    );

    for (const item of matching) {
      const patchRes = await fetch(`${API_BASE}/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAvailable })
      });

      if (!patchRes.ok) {
        throw new Error(`Failed updating ${item.size || item.name}`);
      }
    }

    showToast(isAvailable ? '✅ Group is now available' : '⏸️ Group is now hidden');
    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();
  } catch (error) {
    console.error('Toggle grouped availability failed:', error);
    showToast(error.message || 'Update failed', 'error');
  }
};

async function updateSingleMenuItem(itemId, formData, form) {
  try {
    const variant = formData.variants[0];

    const payload = {
      name: formData.name,
      price: Number(variant.price),
      category: formData.category,
      size: variant.label || null,
      description: formData.description,
      isAvailable: formData.isAvailable
    };

    const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await safeJson(res);
      throw new Error(error?.error || 'Update failed');
    }

    await tryPersistModifiersForItem(itemId, {
      baseToppings: formData.baseToppings,
      addonToppings: formData.addonToppings
    });

    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();

    resetMenuFormState();
    showToast('✅ Item updated successfully!');
  } catch (error) {
    console.error('Update menu item failed:', error);
    showToast(error.message || 'Update failed', 'error');
  }
}

async function updateGroupedMenuItems(groupMeta, formData) {
  try {
    const res = await fetch(`${API_BASE}/api/menu`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load existing variants');
    }

    const payload = await safeJson(res);
    const items = normalizeMenuItems(payload);

    const existing = items.filter((item) =>
      normalizeCategory(item.category) === normalizeCategory(groupMeta.category) &&
      String(item.name || '').trim().toLowerCase() === String(groupMeta.name || '').trim().toLowerCase()
    );

    const bySize = new Map(
      existing.map((item) => [String(item.size || '').trim().toLowerCase(), item])
    );

    const incomingKeys = new Set();

    for (const variant of formData.variants) {
      const sizeKey = String(variant.label || '').trim().toLowerCase();
      incomingKeys.add(sizeKey);

      const existingItem = bySize.get(sizeKey);

      const itemPayload = {
        name: formData.name,
        price: Number(variant.price),
        category: formData.category,
        size: variant.label || null,
        description: formData.description,
        isAvailable: formData.isAvailable
      };

      if (existingItem) {
        const updateRes = await fetch(`${API_BASE}/api/menu/${existingItem.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(itemPayload)
        });

        if (!updateRes.ok) {
          const error = await safeJson(updateRes);
          throw new Error(error?.error || `Failed to update ${variant.label}`);
        }

        await tryPersistModifiersForItem(existingItem.id, {
          baseToppings: formData.baseToppings,
          addonToppings: formData.addonToppings
        });
      } else {
        const createRes = await fetch(`${API_BASE}/api/menu`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(itemPayload)
        });

        if (!createRes.ok) {
          const error = await safeJson(createRes);
          throw new Error(error?.error || `Failed to create ${variant.label}`);
        }

        const createdPayload = await safeJson(createRes);
        const createdItem = normalizeMenuItem(createdPayload) || createdPayload?.data || createdPayload || null;

        if (createdItem?.id) {
          await tryPersistModifiersForItem(createdItem.id, {
            baseToppings: formData.baseToppings,
            addonToppings: formData.addonToppings
          });
        }
      }
    }

    for (const item of existing) {
      const sizeKey = String(item.size || '').trim().toLowerCase();
      if (!incomingKeys.has(sizeKey)) {
        const deleteRes = await fetch(`${API_BASE}/api/menu/${item.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!deleteRes.ok) {
          throw new Error(`Failed to remove ${item.size || item.name}`);
        }
      }
    }

    await loadAdminMenu();
    if (window.loadMenu) window.loadMenu();

    resetMenuFormState();
    showToast('✅ Group updated successfully!');
  } catch (error) {
    console.error('Update grouped menu items failed:', error);
    showToast(error.message || 'Update failed', 'error');
  }
}

async function updateMenuItem(itemId, form) {
  const formData = getCurrentMenuFormValues();

  if (!formData.name || Number.isNaN(formData.basePrice) || formData.basePrice <= 0) {
    showToast('Please fill name and valid base price', 'error');
    return;
  }

  if (!formData.variants.length) {
    showToast('Please keep at least one valid size or portion', 'error');
    return;
  }

  await updateSingleMenuItem(itemId, formData, form);
}

function syncDynamicFormHints() {
  const categoryEl = document.getElementById('item-category');
  const variantsHelp = document.getElementById('item-variants-help');
  const baseToppingsTitle = document.getElementById('base-toppings-title');
  const addonToppingsTitle = document.getElementById('addon-toppings-title');

  if (!categoryEl) return;

  const category = normalizeCategory(categoryEl.value);

  if (variantsHelp) {
    if (isGroupedCategory(category)) {
      variantsHelp.textContent = 'Add as many sizes or portions as you need. These will render as one grouped card in admin.';
    } else {
      variantsHelp.textContent = 'Add one or more options. For simple items, one row is enough.';
    }
  }

  if (baseToppingsTitle) {
    baseToppingsTitle.textContent = `Base removable ${category === 'salad' ? 'ingredients' : 'toppings'}`;
  }

  if (addonToppingsTitle) {
    addonToppingsTitle.textContent = `Optional add-on ${category === 'salad' ? 'ingredients' : 'toppings'}`;
  }
}

export function renderAdminTab() {
  return `
    <div id="admin-tab" class="tab-content" style="display: none;">
      <div style="padding: 2rem; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: white; border-radius: 16px; margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.18);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 0.4rem; font-size: 2rem;">⚙️ Admin Control Panel</h2>
            <p style="margin: 0; color: rgba(255,255,255,0.82);">Monitor orders, update the menu, and track today’s activity.</p>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button
              id="admin-dashboard-btn"
              onclick="window.switchAdminSection('dashboard')"
              class="admin-nav-btn"
              style="padding: 0.75rem 1.1rem; background: ${currentAdminSection === 'dashboard' ? 'white' : 'rgba(255,255,255,0.14)'}; color: ${currentAdminSection === 'dashboard' ? '#1d4ed8' : 'white'}; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.25s;"
            >
              📊 Dashboard
            </button>
            <button
              id="admin-orders-btn"
              onclick="window.switchAdminSection('orders')"
              class="admin-nav-btn"
              style="padding: 0.75rem 1.1rem; background: ${currentAdminSection === 'orders' ? 'white' : 'rgba(255,255,255,0.14)'}; color: ${currentAdminSection === 'orders' ? '#1d4ed8' : 'white'}; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.25s;"
            >
              📋 Orders
            </button>
            <button
              id="admin-menu-btn"
              onclick="window.switchAdminSection('menu')"
              class="admin-nav-btn"
              style="padding: 0.75rem 1.1rem; background: ${currentAdminSection === 'menu' ? 'white' : 'rgba(255,255,255,0.14)'}; color: ${currentAdminSection === 'menu' ? '#1d4ed8' : 'white'}; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.25s;"
            >
              🍕 Menu
            </button>
          </div>
        </div>
      </div>

      <div id="admin-dashboard-section" style="display: ${currentAdminSection === 'dashboard' ? 'block' : 'none'};">
        ${renderDashboard()}
      </div>

      <div id="admin-orders-section" style="display: ${currentAdminSection === 'orders' ? 'block' : 'none'};">
        ${renderOrdersPanel()}
      </div>

      <div id="admin-menu-section" style="display: ${currentAdminSection === 'menu' ? 'block' : 'none'};">
        ${renderMenuManagement()}
      </div>
    </div>

    <style>
      .admin-nav-btn:hover {
        opacity: 0.96;
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(0,0,0,0.16);
      }

      .stat-card {
        background: white;
        padding: 1.25rem;
        border-radius: 14px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        transition: all 0.25s ease;
      }

      .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      }

      .admin-kpi-card {
        border: 1px solid #eef2f7;
      }

      .admin-kpi-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        flex-shrink: 0;
      }

      .menu-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
      }

      .admin-action-btn:hover {
        filter: brightness(0.96);
        transform: translateY(-1px);
      }

      .admin-panel-input:focus,
      .admin-panel-select:focus,
      .admin-panel-textarea:focus {
        outline: none;
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
      }

      @keyframes dashboardShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (max-width: 768px) {
        .admin-two-col {
          grid-template-columns: 1fr !important;
        }

        .variant-row,
        .topping-row {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
}

function renderDashboard() {
  return `
    <div id="dashboard-content">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="stat-card admin-kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Orders Today</p>
              <h2 id="stat-orders-today" style="margin: 0.5rem 0 0; color: #1d4ed8; font-size: 2rem;">...</h2>
            </div>
            <div class="admin-kpi-icon" style="background: #dbeafe; color: #1d4ed8;">📦</div>
          </div>
        </div>

        <div class="stat-card admin-kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Revenue Today</p>
              <h2 id="stat-revenue-today" style="margin: 0.5rem 0 0; color: #15803d; font-size: 2rem;">...</h2>
            </div>
            <div class="admin-kpi-icon" style="background: #dcfce7; color: #15803d;">💰</div>
          </div>
        </div>

        <div class="stat-card admin-kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Active Orders</p>
              <h2 id="stat-active-orders" style="margin: 0.5rem 0 0; color: #b45309; font-size: 2rem;">...</h2>
            </div>
            <div class="admin-kpi-icon" style="background: #fef3c7; color: #b45309;">⏱️</div>
          </div>
        </div>

        <div class="stat-card admin-kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Pending Orders</p>
              <h2 id="stat-pending-orders" style="margin: 0.5rem 0 0; color: #ea580c; font-size: 2rem;">...</h2>
            </div>
            <div class="admin-kpi-icon" style="background: #ffedd5; color: #ea580c;">🆕</div>
          </div>
        </div>

        <div class="stat-card admin-kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Menu Items</p>
              <h2 id="stat-menu-items" style="margin: 0.5rem 0 0; color: #0f766e; font-size: 2rem;">...</h2>
            </div>
            <div class="admin-kpi-icon" style="background: #ccfbf1; color: #0f766e;">🍕</div>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 1.5rem; border-radius: 14px; box-shadow: 0 2px 8px rgba(15,23,42,0.08); margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <div>
            <h3 style="margin: 0; color: #111827;">Quick Actions</h3>
            <p style="margin: 0.35rem 0 0; color: #6b7280; font-size: 0.95rem;">Jump to common admin tasks fast.</p>
          </div>
          <button class="admin-action-btn" onclick="window.refreshDashboard()" style="padding: 0.8rem 1rem; background: #111827; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.2s;">
            Refresh Dashboard
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          <button class="admin-action-btn" onclick="window.switchAdminSection('orders')" style="padding: 1rem; background: #2563eb; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; text-align: left; transition: all 0.2s;">
            📋 View Orders
          </button>
          <button class="admin-action-btn" onclick="window.switchAdminSection('menu')" style="padding: 1rem; background: #16a34a; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; text-align: left; transition: all 0.2s;">
            ➕ Add Menu Item
          </button>
          <button class="admin-action-btn" onclick="window.switchAdminSection('orders'); setTimeout(() => window.switchOrderTab?.('new'), 200)" style="padding: 1rem; background: #ea580c; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; text-align: left; transition: all 0.2s;">
            🆕 Review New Orders
          </button>
        </div>
      </div>

      <div style="background: white; padding: 1.5rem; border-radius: 14px; box-shadow: 0 2px 8px rgba(15,23,42,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <div>
            <h3 style="margin: 0; color: #111827;">Recent Orders</h3>
            <p style="margin: 0.35rem 0 0; color: #6b7280; font-size: 0.95rem;">Latest pickup and delivery activity.</p>
          </div>
          <button class="admin-action-btn" onclick="window.switchAdminSection('orders')" style="padding: 0.65rem 1rem; background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.2s;">
            Open Orders Panel
          </button>
        </div>
        <div id="recent-orders-list">
          <p style="text-align: center; color: #666;">Loading...</p>
        </div>
      </div>
    </div>
  `;
}

function renderMenuManagement() {
  return `
    <div style="background: white; padding: 2rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(15,23,42,0.08); margin-bottom: 2rem;">
      <h3 style="color: #111827; margin-top: 0;">➕ Add New Menu Item</h3>
      <form id="menu-form">
        <div class="admin-two-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <input id="item-name" placeholder="Item Name" class="admin-panel-input" style="width: 100%; padding: 0.85rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1rem;" required>
          <input id="item-price" type="number" step="0.01" placeholder="Base Price ($)" class="admin-panel-input" style="width: 100%; padding: 0.85rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1rem;" required>
        </div>

        <div class="admin-two-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
          <select id="item-category" class="admin-panel-select" style="width: 100%; padding: 0.85rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1rem;">
            <option value="pizza">🍕 Pizza</option>
            <option value="salad">🥗 Salad</option>
            <option value="calzone">🌯 Calzone</option>
            <option value="pasta">🍝 Pasta</option>
            <option value="hamburger">🍔 Hamburger</option>
            <option value="sub">🥖 Sub</option>
            <option value="wings">🍗 Wings</option>
            <option value="nuggets">🍟 Nuggets</option>
            <option value="calamari">🦑 Calamari</option>
          </select>

          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #374151; font-weight: 600; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 0.85rem 1rem;">
            <input type="checkbox" id="item-available" checked> Available
          </label>
        </div>

        <textarea id="item-desc" placeholder="Description (optional)" class="admin-panel-textarea" style="width: 100%; padding: 0.85rem; margin-top: 1rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1rem; height: 90px;"></textarea>

        <div style="margin-top: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:0.5rem; flex-wrap:wrap;">
            <div>
              <h4 style="margin:0; color:#111827;">Sizes / Portions</h4>
              <p id="item-variants-help" style="margin:0.25rem 0 0; color:#6b7280; font-size:0.9rem;">Add one or more options for this item.</p>
            </div>
            <button type="button" id="add-variant-btn" class="admin-action-btn" style="padding:0.7rem 1rem; background:#2563eb; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">
              + Add Size
            </button>
          </div>
          <div id="item-variants-list"></div>
        </div>

        <div class="admin-two-col" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top:1.5rem;">
          <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fcfcfd;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:0.5rem; flex-wrap:wrap;">
              <div>
                <h4 id="base-toppings-title" style="margin:0; color:#111827;">Base removable toppings</h4>
                <p style="margin:0.25rem 0 0; color:#6b7280; font-size:0.9rem;">These start on the item and customers can remove them.</p>
              </div>
              <button type="button" id="add-base-topping-btn" class="admin-action-btn" style="padding:0.65rem 0.9rem; background:#0f766e; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">
                + Add Base
              </button>
            </div>
            <div id="item-base-toppings-list"></div>
          </div>

          <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fcfcfd;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:0.5rem; flex-wrap:wrap;">
              <div>
                <h4 id="addon-toppings-title" style="margin:0; color:#111827;">Optional add-on toppings</h4>
                <p style="margin:0.25rem 0 0; color:#6b7280; font-size:0.9rem;">These can be added for an extra charge.</p>
              </div>
              <button type="button" id="add-addon-topping-btn" class="admin-action-btn" style="padding:0.65rem 0.9rem; background:#7c3aed; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">
                + Add Add-on
              </button>
            </div>
            <div id="item-addon-toppings-list"></div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem; flex-wrap: wrap;">
          <button type="submit" class="admin-action-btn" style="flex: 1; min-width: 180px; padding: 0.85rem; background: #16a34a; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem; transition: all 0.2s;">
            ➕ Add Item
          </button>
          <button type="button" id="cancel-edit-btn" onclick="window.cancelEditMenuItem()" class="admin-action-btn" style="display: none; padding: 0.85rem 1.4rem; background: #6b7280; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
      <div style="text-align: center; padding: 3rem; color: #666;">Loading menu...</div>
    </div>
  `;
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; border: 1px dashed #d1d5db; border-radius: 12px; color: #6b7280;">
        <div style="font-size: 2rem; margin-bottom: 0.75rem;">🧾</div>
        <div style="font-weight: 700; color: #374151; margin-bottom: 0.35rem;">No recent orders</div>
        <div style="font-size: 0.95rem;">New orders will show up here after customers place them.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((order) => `
    <div
      style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 0.25rem; border-bottom: 1px solid #f1f5f9; transition: background 0.2s ease; cursor: pointer;"
      onclick="window.switchAdminSection('orders')"
      onmouseover="this.style.background='#f8fafc'"
      onmouseout="this.style.background='transparent'"
    >
      <div style="min-width: 0;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <strong style="color: #2563eb;">#${escapeHtml(order.orderNumber)}</strong>
          <span style="color: #111827; font-weight: 600;">${escapeHtml(order.customerName)}</span>
          <span style="font-size: 0.82rem; color: #6b7280; background: #f3f4f6; padding: 0.2rem 0.55rem; border-radius: 999px; text-transform: capitalize;">
            ${escapeHtml(order.orderType)}
          </span>
        </div>
        <div style="margin-top: 0.35rem; color: #6b7280; font-size: 0.92rem;">
          ${order.itemCount} item${order.itemCount === 1 ? '' : 's'} • ${formatRelativeOrderTime(order.createdAt)}
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
        <span style="color: #15803d; font-weight: 700;">${formatCurrency(order.totalPrice)}</span>
        <span style="padding: 0.35rem 0.75rem; background: ${getStatusColor(order.status)}; color: white; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: capitalize;">
          ${escapeHtml(order.status)}
        </span>
      </div>
    </div>
  `).join('');
}

function renderAdminMenuGrid(items) {
  const container = document.getElementById('admin-menu-grid');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #666; background: white; border-radius: 14px; border: 1px dashed #d1d5db;">
        No menu items yet
      </div>
    `;
    return;
  }

  const groupedItems = groupAdminMenuItems(items);

  container.innerHTML = groupedItems.map((entry) => {
    if (entry.type === 'single') {
      const item = entry.item;

      return `
        <div class="menu-card" style="position: relative; background: white; border: 1px solid ${item.isAvailable ? '#e5e7eb' : '#fecaca'}; border-radius: 14px; padding: 1.25rem; transition: all 0.25s ease;">
          <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
            <button onclick="window.editMenuItem(${item.id})" title="Edit" class="admin-action-btn" style="padding: 0.5rem 0.75rem; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">✏️</button>
            <button onclick="window.deleteMenuItem(${item.id})" title="Delete" class="admin-action-btn" style="padding: 0.5rem 0.75rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🗑️</button>
          </div>

          <div style="padding-right: 4.25rem;">
            <h3 style="color: #111827; margin: 0 0 0.45rem;">${escapeHtml(item.name)}</h3>
            <p style="color: #16a34a; font-weight: 700; margin: 0.35rem 0; font-size: 1.15rem;">${formatCurrency(item.price)}</p>
            <p style="color: #6b7280; margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="background: #eff6ff; color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.82rem; font-weight: 700; text-transform: capitalize;">${escapeHtml(item.category)}</span>
              ${item.size ? `<span style="color: #6b7280; font-size: 0.92rem;">${escapeHtml(item.size)}</span>` : ''}
            </p>
            ${item.description ? `<p style="color: #6b7280; font-size: 0.92rem; margin: 0.85rem 0 0;">${escapeHtml(item.description)}</p>` : ''}
          </div>

          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" ${item.isAvailable ? 'checked' : ''} onchange="window.toggleItemAvailability(${item.id}, this.checked)">
              <span style="color: ${item.isAvailable ? '#16a34a' : '#dc2626'}; font-weight: 700;">${item.isAvailable ? 'Available' : 'Unavailable'}</span>
            </label>
          </div>
        </div>
      `;
    }

    const group = entry;

    return `
      <div class="menu-card" style="position: relative; background: white; border: 1px solid ${group.isAvailable ? '#e5e7eb' : '#fecaca'}; border-radius: 14px; padding: 1.25rem; transition: all 0.25s ease;">
        <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
          <button onclick="window.editGroupedMenuItem('${escapeHtml(group.name)}', '${escapeHtml(group.category)}')" title="Edit group" class="admin-action-btn" style="padding: 0.5rem 0.75rem; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">✏️</button>
          <button onclick="window.deleteGroupedMenuItem('${escapeHtml(group.name)}', '${escapeHtml(group.category)}')" title="Delete group" class="admin-action-btn" style="padding: 0.5rem 0.75rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🗑️</button>
        </div>

        <div style="padding-right: 4.25rem;">
          <h3 style="color: #111827; margin: 0 0 0.45rem;">${escapeHtml(group.name)}</h3>
          <p style="color: #16a34a; font-weight: 700; margin: 0.35rem 0; font-size: 1.15rem;">
            ${group.minPrice === group.maxPrice
              ? formatCurrency(group.minPrice)
              : `${formatCurrency(group.minPrice)} - ${formatCurrency(group.maxPrice)}`}
          </p>
          <p style="color: #6b7280; margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="background: #eff6ff; color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.82rem; font-weight: 700; text-transform: capitalize;">${escapeHtml(group.category)}</span>
            <span style="color: #6b7280; font-size: 0.92rem;">${group.variants.length} options</span>
          </p>
          ${group.description ? `<p style="color: #6b7280; font-size: 0.92rem; margin: 0.85rem 0 0;">${escapeHtml(group.description)}</p>` : ''}
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:0.85rem; flex-wrap:wrap;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" ${group.isAvailable ? 'checked' : ''} onchange="window.toggleGroupedAvailability('${escapeHtml(group.name)}', '${escapeHtml(group.category)}', this.checked)">
              <span style="color: ${group.isAvailable ? '#16a34a' : '#dc2626'}; font-weight: 700;">${group.isAvailable ? 'Available' : 'Unavailable'}</span>
            </label>
          </div>

          <div style="display: grid; gap: 0.5rem;">
            ${group.variants.map((variant) => `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.55rem 0.7rem; background: #f8fafc; border-radius: 10px;">
                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                  <span style="font-weight: 700; color: #111827;">${escapeHtml(variant.size || 'Standard')}</span>
                  <span style="font-size: 0.82rem; color: ${variant.isAvailable ? '#16a34a' : '#dc2626'};">
                    ${variant.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 700; color: #16a34a;">${formatCurrency(variant.price)}</span>
                  <button onclick="window.editMenuItem(${variant.id})" title="Edit ${escapeHtml(variant.size || 'size')}" class="admin-action-btn" style="padding: 0.45rem 0.65rem; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.82rem;">✏️</button>
                  <button onclick="window.deleteMenuItem(${variant.id})" title="Delete ${escapeHtml(variant.size || 'size')}" class="admin-action-btn" style="padding: 0.45rem 0.65rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.82rem;">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.switchAdminSection = async (section) => {
  currentAdminSection = section;

  ['dashboard', 'orders', 'menu'].forEach((sec) => {
    const el = document.getElementById(`admin-${sec}-section`);
    if (el) el.style.display = 'none';

    const btn = document.getElementById(`admin-${sec}-btn`);
    if (btn) {
      btn.style.background = sec === section ? 'white' : 'rgba(255,255,255,0.14)';
      btn.style.color = sec === section ? '#1d4ed8' : 'white';
    }
  });

  const selectedSection = document.getElementById(`admin-${section}-section`);
  if (selectedSection) selectedSection.style.display = 'block';

  if (section === 'dashboard') {
    await loadDashboardStats();
  } else if (section === 'orders') {
    await initOrdersPanel();
  } else if (section === 'menu') {
    await loadAdminMenu();
    syncDynamicFormHints();
  }
};

function wireDynamicMenuForm() {
  const form = document.getElementById('menu-form');
  if (!form) return;

  const categoryEl = document.getElementById('item-category');
  const basePriceEl = document.getElementById('item-price');
  const addVariantBtn = document.getElementById('add-variant-btn');
  const addBaseToppingBtn = document.getElementById('add-base-topping-btn');
  const addAddonToppingBtn = document.getElementById('add-addon-topping-btn');

  if (addVariantBtn && !addVariantBtn.dataset.bound) {
    addVariantBtn.dataset.bound = 'true';
    addVariantBtn.addEventListener('click', () => addVariantRow({ label: '', price: '' }));
  }

  if (addBaseToppingBtn && !addBaseToppingBtn.dataset.bound) {
    addBaseToppingBtn.dataset.bound = 'true';
    addBaseToppingBtn.addEventListener('click', () => addBaseToppingRow({ name: '' }));
  }

  if (addAddonToppingBtn && !addAddonToppingBtn.dataset.bound) {
    addAddonToppingBtn.dataset.bound = 'true';
    addAddonToppingBtn.addEventListener('click', () => addAddonToppingRow({ name: '', price: '' }));
  }

  if (form && !form.dataset.delegated) {
    form.dataset.delegated = 'true';
    form.addEventListener('click', (event) => {
      const removeVariantBtn = event.target.closest('.remove-variant-btn');
      if (removeVariantBtn) {
        const rows = form.querySelectorAll('.variant-row');
        if (rows.length <= 1) {
          showToast('At least one size or portion is required', 'error');
          return;
        }
        removeVariantBtn.closest('.variant-row')?.remove();
        return;
      }

      const removeToppingBtn = event.target.closest('.remove-topping-btn');
      if (removeToppingBtn) {
        removeToppingBtn.closest('.topping-row')?.remove();
      }
    });
  }

  if (categoryEl && !categoryEl.dataset.bound) {
    categoryEl.dataset.bound = 'true';
    categoryEl.addEventListener('change', () => {
      const basePrice = parseFloat(basePriceEl?.value || '0') || 0;
      fillDynamicFormForCategory(categoryEl.value, basePrice, true);
      syncDynamicFormHints();
    });
  }

  if (basePriceEl && !basePriceEl.dataset.bound) {
    basePriceEl.dataset.bound = 'true';
    basePriceEl.addEventListener('change', () => {
      const variants = collectVariantsFromForm();
      const shouldAutoFill = variants.every((variant) => !variant.label || !variant.price);
      if (shouldAutoFill) {
        fillDynamicFormForCategory(categoryEl?.value || 'pizza', parseFloat(basePriceEl.value || '0') || 0, true);
      }
    });
  }

  const existingVariants = collectVariantsFromForm();
  if (!existingVariants.length) {
    fillDynamicFormForCategory(categoryEl?.value || 'pizza', parseFloat(basePriceEl?.value || '0') || 0, true);
  }

  syncDynamicFormHints();
}

export function initAdminPanel() {
  console.log('🔧 Initializing admin panel...');

  const checkForm = () => {
    const form = document.getElementById('menu-form');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const editingId = submitBtn?.dataset.editing;
        const editingGroupRaw = submitBtn?.dataset.editingGroup;

        if (editingGroupRaw) {
          const groupMeta = JSON.parse(editingGroupRaw);
          await updateGroupedMenuItems(groupMeta, getCurrentMenuFormValues());
        } else if (editingId) {
          await updateMenuItem(editingId, form);
        } else {
          await addMenuItem(e);
        }
      };

      wireDynamicMenuForm();
      console.log('✅ Admin form wired!');
    } else {
      setTimeout(checkForm, 100);
    }
  };

  checkForm();

  if (currentAdminSection === 'dashboard') {
    loadDashboardStats();
  } else if (currentAdminSection === 'orders') {
    initOrdersPanel();
  } else if (currentAdminSection === 'menu') {
    loadAdminMenu();
    syncDynamicFormHints();
  }
}

export default {
  renderAdminTab,
  initAdminPanel,
  loadAdminMenu
};