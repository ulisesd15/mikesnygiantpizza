// frontend/components/adminPanel.js
import { showToast } from '../utils/cartStore.js';
import { renderOrdersPanel, initOrdersPanel } from './admin/OrdersPanel.js';

let currentAdminSection = 'dashboard'; // Default to dashboard



// Load dashboard stats
async function loadDashboardStats() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Please log in again');
      document.getElementById('stat-orders-today').textContent = '—';
      document.getElementById('stat-revenue-today').textContent = '$0.00';
      document.getElementById('stat-active-orders').textContent = '—';
      document.getElementById('stat-menu-items').textContent = '—';
      return;
    }
    // Fetch stats from backend
    // ✅ FIXED: Changed endpoint from /api/orders/all to /api/admin/all
     const [ordersRes, menuRes] = await Promise.all([
      fetch('http://localhost:5001/api/admin/all', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch('http://localhost:5001/api/menu', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    
    // Better error handling
    if (!ordersRes.ok) {
      const error = await ordersRes.json();
      throw new Error(`Orders API Error (${ordersRes.status}): ${error.error || 'Unknown error'}`);
    }
    
    if (!menuRes.ok) {
      const error = await menuRes.json();
      throw new Error(`Menu API Error (${menuRes.status}): ${error.error || 'Unknown error'}`);
    }
    
    const ordersData = await ordersRes.json();
    const menuData = await menuRes.json();
    
    console.log('✅ Orders data received:', ordersData);
    console.log('✅ Menu data received:', menuData);
    
    // Flexible data extraction
    const orders = ordersData.data?.orders || ordersData.orders || [];
    const menuItems = menuData.data || menuData || [];
    
    // Calculate stats
    const today = new Date().toDateString();
    const ordersToday = orders.filter(o => {
      try {
        return new Date(o.createdAt).toDateString() === today;
      } catch (e) {
        return false;
      }
    });
    
    const revenueToday = ordersToday.reduce((sum, o) => {
      const total = parseFloat(o.total) || 0;
      return sum + total;
    }, 0);
    
    const activeOrders = orders.filter(o => 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    );
    
    console.log('📈 Stats:', { 
      ordersToday: ordersToday.length, 
      revenueToday, 
      activeOrders: activeOrders.length, 
      menuItems: menuItems.length 
    });
    
    // Update UI
    document.getElementById('stat-orders-today').textContent = ordersToday.length;
    document.getElementById('stat-revenue-today').textContent = `$${revenueToday.toFixed(2)}`;
    document.getElementById('stat-active-orders').textContent = activeOrders.length;
    document.getElementById('stat-menu-items').textContent = menuItems.length;
    
    // Show recent orders
    renderRecentOrders(orders.slice(0, 5));
    
    console.log('✅ Dashboard stats loaded successfully');
    
  } catch (error) {
    console.error('❌ Failed to load dashboard stats:', error.message);
    document.getElementById('stat-orders-today').textContent = '⚠️';
    document.getElementById('stat-revenue-today').textContent = '⚠️';
    document.getElementById('stat-active-orders').textContent = '⚠️';
    document.getElementById('stat-menu-items').textContent = '⚠️';
  }
}

window.refreshDashboard = () => {
  loadDashboardStats();
  showToast('Dashboard refreshed!');
};

// Menu CRUD Operations
export async function addMenuItem(e) {
  e.preventDefault();
  
  if (!window.currentUser || window.currentUser.role !== 'admin') {
    showToast('Admin access required!', 'error');
    return;
  }

  const formData = {
    name: document.getElementById('item-name').value.trim(),
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    size: document.getElementById('item-size')?.value.trim() || null,
    description: document.getElementById('item-desc').value.trim() || null,
    isAvailable: document.getElementById('item-available').checked
  };

  if (!formData.name || !formData.price || formData.price <= 0) {
    showToast('Please fill name and valid price', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:5001/api/menu', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      if (window.loadMenu) window.loadMenu();
      loadAdminMenu();
      e.target.reset();
      showToast('✅ Item added successfully!');
    } else {
      const error = await res.json();
      showToast(error.error || 'Failed to add item', 'error');
    }
  } catch (error) {
    showToast('Network error - try again', 'error');
    console.error('Add menu item failed:', error);
  }
}

export async function loadAdminMenu() {
  if (!window.currentUser || window.currentUser.role !== 'admin') {
    const grid = document.getElementById('admin-menu-grid');
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #dc3545;">🔐 Admin access required</div>';
    }
    return;
  }

  try {
    const res = await fetch('http://localhost:5001/api/menu', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      const items = await res.json();
      renderAdminMenuGrid(items);
    }
  } catch (error) {
    const grid = document.getElementById('admin-menu-grid');
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">⚠️ Failed to load menu</div>';
    }
  }
}


// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    'pending': '#ff6b35',
    'accepted': '#007bff',
    'preparing': '#ffc107',
    'ready': '#28a745',
    'completed': '#6c757d',
    'cancelled': '#dc3545'
  };
  return colors[status] || '#6c757d';
}


// Global functions
window.editMenuItem = async (itemId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const item = await res.json();
    
    if (item) {
      if (currentAdminSection !== 'menu') {
        window.switchAdminSection('menu');
      }
      
      setTimeout(() => {
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-size').value = item.size || '';
        document.getElementById('item-desc').value = item.description || '';
        document.getElementById('item-available').checked = item.isAvailable;
        
        const submitBtn = document.querySelector('#menu-form button[type="submit"]');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        
        if (submitBtn) {
          submitBtn.textContent = '💾 Update Item';
          submitBtn.dataset.editing = itemId;
        }
        
        if (cancelBtn) cancelBtn.style.display = 'block';
        
        document.getElementById('menu-form')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Editing: ${item.name}`);
      }, 100);
    }
  } catch (error) {
    showToast('Failed to load item', 'error');
  }
};

window.cancelEditMenuItem = () => {
  const form = document.getElementById('menu-form');
  if (form) {
    form.reset();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    if (submitBtn) {
      submitBtn.textContent = '➕ Add Item';
      delete submitBtn.dataset.editing;
    }
    
    if (cancelBtn) cancelBtn.style.display = 'none';
  }
};

window.deleteMenuItem = async (itemId) => {
  if (!confirm('Delete this menu item? This cannot be undone.')) return;
  
  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      loadAdminMenu();
      if (window.loadMenu) window.loadMenu();
      showToast('🗑️ Item deleted successfully');
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    showToast('Delete failed', 'error');
  }
};

window.toggleItemAvailability = async (itemId, isAvailable) => {
  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isAvailable })
    });
    
    if (res.ok) {
      showToast(isAvailable ? '✅ Item is now available' : '⏸️ Item is now hidden');
      loadAdminMenu();
      if (window.loadMenu) window.loadMenu();
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
};

async function updateMenuItem(itemId, form) {
  const formData = {
    name: document.getElementById('item-name').value.trim(),
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    size: document.getElementById('item-size')?.value.trim() || null,
    description: document.getElementById('item-desc').value.trim() || null,
    isAvailable: document.getElementById('item-available').checked
  };

  if (!formData.name || !formData.price || formData.price <= 0) {
    showToast('Please fill name and valid price', 'error');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      loadAdminMenu();
      if (window.loadMenu) window.loadMenu();
      form.reset();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const cancelBtn = document.getElementById('cancel-edit-btn');
      
      if (submitBtn) {
        submitBtn.textContent = '➕ Add Item';
        delete submitBtn.dataset.editing;
      }
      
      if (cancelBtn) cancelBtn.style.display = 'none';
      
      showToast('✅ Item updated successfully!');
    } else {
      const error = await res.json();
      showToast(error.error || 'Update failed', 'error');
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
}

export function renderAdminTab() {
  return `
    <div id="admin-tab" class="tab-content" style="display: none;">
      <!-- Admin Header with Navigation -->
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <h2 style="margin: 0 0 1.5rem; font-size: 2rem;">⚙️ Admin Control Panel</h2>
        
        <!-- Admin Navigation Tabs -->
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button 
            id="admin-dashboard-btn"
            onclick="window.switchAdminSection('dashboard')" 
            class="admin-nav-btn"
            style="padding: 0.75rem 1.5rem; background: ${currentAdminSection === 'dashboard' ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${currentAdminSection === 'dashboard' ? '#007bff' : 'white'}; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
          >
            📊 Dashboard
          </button>
          <button 
            id="admin-orders-btn"
            onclick="window.switchAdminSection('orders')" 
            class="admin-nav-btn"
            style="padding: 0.75rem 1.5rem; background: ${currentAdminSection === 'orders' ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${currentAdminSection === 'orders' ? '#007bff' : 'white'}; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
          >
            📋 Orders
          </button>
          <button 
            id="admin-menu-btn"
            onclick="window.switchAdminSection('menu')" 
            class="admin-nav-btn"
            style="padding: 0.75rem 1.5rem; background: ${currentAdminSection === 'menu' ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${currentAdminSection === 'menu' ? '#007bff' : 'white'}; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
          >
            🍕 Menu
          </button>
        </div>
      </div>

      <!-- Dashboard Section -->
      <div id="admin-dashboard-section" style="display: ${currentAdminSection === 'dashboard' ? 'block' : 'none'};">
        ${renderDashboard()}
      </div>

      <!-- Orders Management Section -->
      <div id="admin-orders-section" style="display: ${currentAdminSection === 'orders' ? 'block' : 'none'};">
        ${renderOrdersPanel()}
      </div>

      <!-- Menu Management Section -->
      <div id="admin-menu-section" style="display: ${currentAdminSection === 'menu' ? 'block' : 'none'};">
        ${renderMenuManagement()}
      </div>
    </div>

    <style>
      .admin-nav-btn:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s;
      }
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
    </style>
  `;
}

function renderDashboard() {
  return `
    <div id="dashboard-content">
      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="stat-card" style="border-left: 4px solid #007bff;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="margin: 0; color: #666; font-size: 0.9rem;">Total Orders Today</p>
              <h2 id="stat-orders-today" style="margin: 0.5rem 0 0; color: #007bff; font-size: 2rem;">...</h2>
            </div>
            <div style="font-size: 2.5rem;">📦</div>
          </div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #28a745;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="margin: 0; color: #666; font-size: 0.9rem;">Revenue Today</p>
              <h2 id="stat-revenue-today" style="margin: 0.5rem 0 0; color: #28a745; font-size: 2rem;">...</h2>
            </div>
            <div style="font-size: 2.5rem;">💰</div>
          </div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #ffc107;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="margin: 0; color: #666; font-size: 0.9rem;">Active Orders</p>
              <h2 id="stat-active-orders" style="margin: 0.5rem 0 0; color: #ffc107; font-size: 2rem;">...</h2>
            </div>
            <div style="font-size: 2.5rem;">⏱️</div>
          </div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #17a2b8;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="margin: 0; color: #666; font-size: 0.9rem;">Total Menu Items</p>
              <h2 id="stat-menu-items" style="margin: 0.5rem 0 0; color: #17a2b8; font-size: 2rem;">...</h2>
            </div>
            <div style="font-size: 2.5rem;">🍕</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <h3 style="margin: 0 0 1.5rem; color: #333;">⚡ Quick Actions</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <button onclick="window.switchAdminSection('orders')" style="padding: 1rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
            📋 View All Orders
          </button>
          <button onclick="window.switchAdminSection('menu')" style="padding: 1rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
            ➕ Add Menu Item
          </button>
          <button onclick="window.refreshDashboard()" style="padding: 1rem; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
            🔄 Refresh Stats
          </button>
        </div>
      </div>

      <!-- Recent Orders -->
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 1.5rem; color: #333;">🕐 Recent Orders</h3>
        <div id="recent-orders-list">
          <p style="text-align: center; color: #666;">Loading...</p>
        </div>
      </div>
    </div>
  `;
}

function renderMenuManagement() {
  return `
    <!-- Add/Edit Form -->
    <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
      <h3 style="color: #333; margin-top: 0;">➕ Add New Menu Item</h3>
      <form id="menu-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <input id="item-name" placeholder="Item Name" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;" required>
          <input id="item-price" type="number" step="0.01" placeholder="Price ($)" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;" required>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
          <select id="item-category" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
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
          
          <input id="item-size" placeholder="Size (optional)" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
        </div>
        
        <textarea id="item-desc" placeholder="Description (optional)" class="input-style" style="width: 100%; padding: 0.75rem; margin-top: 1rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; height: 80px;"></textarea>
        
        <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="item-available" checked> Available
          </label>
          <button type="submit" class="button-primary" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;">
            ➕ Add Item
          </button>
          <button type="button" id="cancel-edit-btn" onclick="window.cancelEditMenuItem()" style="display: none; padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Admin Menu Grid -->
    <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
      <div style="text-align: center; padding: 3rem; color: #666;">Loading menu...</div>
    </div>
  `;
}

 function renderRecentOrders(orders) {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666;">No recent orders</p>';
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; transition: all 0.3s; cursor: pointer;" onclick="window.switchAdminSection('orders')" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
      <div>
        <strong style="color: #007bff;">#${order.orderNumber || order.id}</strong>
        <span style="margin-left: 1rem; color: #666;">${order.customerName || 'Guest'}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="color: #28a745; font-weight: 600;">$${parseFloat(order.total).toFixed(2)}</span>
        <span style="padding: 0.25rem 0.75rem; background: #007bff; color: white; border-radius: 12px; font-size: 0.85rem;">${order.status}</span>
      </div>
    </div>
  `).join('');
}

function renderAdminMenuGrid(items) {
  const container = document.getElementById('admin-menu-grid');
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">No menu items yet</div>';
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="menu-card" style="position: relative; background: white; border: 2px solid ${item.isAvailable ? '#ddd' : '#dc3545'}; border-radius: 12px; padding: 1.5rem; transition: all 0.3s;">
      <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
        <button onclick="window.editMenuItem(${item.id})" title="Edit" style="padding: 0.5rem 0.75rem; background: #ffc107; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">✏️</button>
        <button onclick="window.deleteMenuItem(${item.id})" title="Delete" style="padding: 0.5rem 0.75rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">🗑️</button>
      </div>
      <h3 style="color: #007bff; margin: 0 0 0.5rem; padding-right: 4rem;">${item.name}</h3>
      <p style="color: #28a745; font-weight: 600; margin: 0.5rem 0; font-size: 1.2rem;">$${parseFloat(item.price).toFixed(2)}</p>
      <p style="color: #666; margin: 0.5rem 0;">
        <span style="background: #007bff; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${item.category}</span>
        ${item.size ? `<span style="margin-left: 0.5rem; color: #666;">${item.size}</span>` : ''}
      </p>
      ${item.description ? `<p style="color: #888; font-size: 0.9rem; margin: 1rem 0;">${item.description}</p>` : ''}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" ${item.isAvailable ? 'checked' : ''} onchange="window.toggleItemAvailability(${item.id}, this.checked)"> 
          <span style="color: ${item.isAvailable ? '#28a745' : '#dc3545'}; font-weight: 600;">${item.isAvailable ? 'Available' : 'Unavailable'}</span>
        </label>
      </div>
    </div>
  `).join('');
}

// Switch between admin sections
window.switchAdminSection = async (section) => {
  console.log('Switching to admin section:', section);
  currentAdminSection = section;
  
  // Hide all sections
  ['dashboard', 'orders', 'menu'].forEach(sec => {
    const el = document.getElementById(`admin-${sec}-section`);
    if (el) el.style.display = 'none';
    
    const btn = document.getElementById(`admin-${sec}-btn`);
    if (btn) {
      btn.style.background = sec === section ? 'white' : 'rgba(255,255,255,0.2)';
      btn.style.color = sec === section ? '#007bff' : 'white';
    }
  });
  
  // Show selected section
  const selectedSection = document.getElementById(`admin-${section}-section`);
  if (selectedSection) selectedSection.style.display = 'block';
  
  // Initialize section-specific content
  if (section === 'dashboard') {
    await loadDashboardStats();
  } else if (section === 'orders') {
    await initOrdersPanel();
  } else if (section === 'menu') {
    loadAdminMenu();
  }
};

export function initAdminPanel() {
  console.log('🔧 Initializing admin panel...');
  
  const checkForm = () => {
    const form = document.getElementById('menu-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const editingId = submitBtn?.dataset.editing;
        
        if (editingId) {
          await updateMenuItem(editingId, form);
        } else {
          await addMenuItem(e);
        }
      };
      console.log('✅ Admin form wired!');
    } else {
      setTimeout(checkForm, 100);
    }
  };
  checkForm();
  
  // Load initial content
  if (currentAdminSection === 'dashboard') {
    loadDashboardStats();
  } else if (currentAdminSection === 'orders') {
    initOrdersPanel();
  } else if (currentAdminSection === 'menu') {
    loadAdminMenu();
  }
}
