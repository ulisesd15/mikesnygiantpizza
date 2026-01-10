// frontend/components/adminPanel.js
import { showToast } from '../utils/cartStore.js';
import { renderOrdersPanel, initOrdersPanel } from './admin/OrdersPanel.js';

let currentAdminSection = 'menu'; // Track current section

export function renderAdminTab() {
  return `
    <div id="admin-tab" class="tab-content" style="display: none;">
      <!-- Admin Header with Navigation -->
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin: 0 0 1rem; font-size: 2rem;">⚙️ Admin Panel</h2>
        
        <!-- Admin Navigation Tabs -->
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button 
            id="admin-menu-btn"
            onclick="window.switchAdminSection('menu')" 
            class="admin-nav-btn ${currentAdminSection === 'menu' ? 'active' : ''}"
            style="padding: 0.75rem 2rem; background: ${currentAdminSection === 'menu' ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${currentAdminSection === 'menu' ? '#007bff' : 'white'}; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
          >
            🍕 Menu Management
          </button>
          <button 
            id="admin-orders-btn"
            onclick="window.switchAdminSection('orders')" 
            class="admin-nav-btn ${currentAdminSection === 'orders' ? 'active' : ''}"
            style="padding: 0.75rem 2rem; background: ${currentAdminSection === 'orders' ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${currentAdminSection === 'orders' ? '#007bff' : 'white'}; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
          >
            📋 Orders Management
          </button>
        </div>
      </div>

      <!-- Menu Management Section -->
      <div id="admin-menu-section" style="display: ${currentAdminSection === 'menu' ? 'block' : 'none'};">
        ${renderMenuManagement()}
      </div>

      <!-- Orders Management Section -->
      <div id="admin-orders-section" style="display: ${currentAdminSection === 'orders' ? 'block' : 'none'};">
        <div id="admin-panel">
          ${renderOrdersPanel()}
        </div>
      </div>
    </div>

    <style>
      .admin-nav-btn:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .admin-nav-btn.active {
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
    </style>
  `;
}

function renderMenuManagement() {
  return `
    <!-- Add Form -->
    <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
      <h3 style="color: #333; margin-top: 0;">➕ Add New Menu Item</h3>
      <form id="menu-form">
        <input id="item-name" placeholder="Item Name (e.g. Giant Pepperoni)" class="input-style" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
        <input id="item-price" type="number" step="0.01" placeholder="Price ($)" class="input-style" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
        <select id="item-category" class="input-style" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
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
        <textarea id="item-desc" placeholder="Description (optional)" class="input-style" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; height: 80px;"></textarea>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="item-available" checked> Available
          </label>
          <button type="submit" class="button-primary" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;">➕ Add Item</button>
        </div>
      </form>
    </div>

    <!-- Admin Menu Grid -->
    <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
      <div style="text-align: center; padding: 3rem; color: #666;">Loading admin menu...</div>
    </div>
  `;
}

export async function addMenuItem(e) {
  e.preventDefault();
  
  // AUTH CHECK
  if (!window.currentUser || window.currentUser.role !== 'admin') {
    showToast('Admin access required!', 'error');
    return;
  }

  const formData = {
    name: document.getElementById('item-name').value.trim(),
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-desc').value.trim(),
    available: document.getElementById('item-available').checked
  };

  // Validation
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
      if (window.loadMenu) window.loadMenu(); // Refresh public menu
      document.getElementById('admin-menu-grid').innerHTML = '<div style="text-align: center; padding: 2rem; color: #28a745;">🔄 Reloading admin menu...</div>';
      loadAdminMenu();   // Refresh admin grid
      e.target.reset();
      showToast('✅ Item added successfully! 🍕');
    } else {
      const error = await res.json();
      showToast(error.error || 'Failed to add item', 'error');
    }
  } catch (error) {
    showToast('Network error - try again', 'error');
    console.error('Add menu item failed:', error);
  }
}

// Load admin menu grid
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
      grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">⚠️ Failed to load admin menu</div>';
    }
  }
}

function renderAdminMenuGrid(items) {
  const container = document.getElementById('admin-menu-grid');
  
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">No menu items yet</div>';
    return;
  }
  
  container.innerHTML = items.map(item => adminMenuCard(item)).join('');
}

function adminMenuCard(item) {
  return `
    <div class="menu-card admin-card" style="position: relative; background: white; border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem; transition: all 0.3s;">
      <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
        <button class="btn-sm edit-btn" onclick="window.editMenuItem(${item.id})" title="Edit" style="padding: 0.5rem; background: #ffc107; color: white; border: none; border-radius: 6px; cursor: pointer;">✏️</button>
        <button class="btn-sm delete-btn" onclick="window.deleteMenuItem(${item.id})" title="Delete" style="padding: 0.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">🗑️</button>
      </div>
      <h3 style="color: #007bff; margin: 0 0 0.5rem;">${item.emoji || '🍕'} ${item.name}</h3>
      <p style="color: #666; margin: 0.5rem 0;">$${item.price.toFixed(2)} • ${item.category.toUpperCase()}</p>
      ${item.description ? `<p style="color: #888; font-size: 0.9rem; margin: 0.5rem 0;">${item.description}</p>` : ''}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" ${item.available ? 'checked' : ''} onchange="window.toggleItemAvailability(${item.id}, this.checked)"> Available
        </label>
      </div>
    </div>
  `;
}

// ADMIN CRUD FUNCTIONS
window.editMenuItem = async (itemId) => {
  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`);
    const item = await res.json();
    
    if (item) {
      // Switch to menu section if not already there
      if (currentAdminSection !== 'menu') {
        window.switchAdminSection('menu');
      }
      
      // Wait a bit for DOM to update
      setTimeout(() => {
        // Populate form
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-desc').value = item.description || '';
        document.getElementById('item-available').checked = item.available;
        
        // Change form to EDIT mode
        const submitBtn = document.querySelector('#menu-form button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = '💾 Update Item';
          submitBtn.dataset.editing = itemId;
        }
        
        // Scroll to form
        document.getElementById('menu-form')?.scrollIntoView({ behavior: 'smooth' });
        
        showToast(`Editing item #${itemId}`);
      }, 100);
    }
  } catch (error) {
    showToast('Failed to load item', 'error');
  }
};

window.deleteMenuItem = async (itemId) => {
  if (!confirm('Delete this menu item?')) return;
  
  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      loadAdminMenu();  // Refresh grid
      if (window.loadMenu) window.loadMenu(); // Refresh public menu
      showToast('🗑️ Item deleted!');
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    showToast('Delete failed', 'error');
  }
};

window.toggleItemAvailability = async (itemId, available) => {
  try {
    const res = await fetch(`http://localhost:5001/api/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ available })
    });
    
    if (res.ok) {
      showToast(available ? '✅ Item now available' : '⏸️ Item hidden');
      loadAdminMenu();
      if (window.loadMenu) window.loadMenu(); // Refresh public menu
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
};

// Switch between admin sections
window.switchAdminSection = async (section) => {
  console.log('Switching to admin section:', section);
  currentAdminSection = section;
  
  // Hide all sections
  const menuSection = document.getElementById('admin-menu-section');
  const ordersSection = document.getElementById('admin-orders-section');
  
  if (menuSection) menuSection.style.display = 'none';
  if (ordersSection) ordersSection.style.display = 'none';
  
  // Update button styles
  const menuBtn = document.getElementById('admin-menu-btn');
  const ordersBtn = document.getElementById('admin-orders-btn');
  
  if (menuBtn) {
    menuBtn.style.background = section === 'menu' ? 'white' : 'rgba(255,255,255,0.2)';
    menuBtn.style.color = section === 'menu' ? '#007bff' : 'white';
  }
  if (ordersBtn) {
    ordersBtn.style.background = section === 'orders' ? 'white' : 'rgba(255,255,255,0.2)';
    ordersBtn.style.color = section === 'orders' ? '#007bff' : 'white';
  }
  
  // Show selected section
  if (section === 'menu') {
    if (menuSection) menuSection.style.display = 'block';
    loadAdminMenu();
  } else if (section === 'orders') {
    if (ordersSection) ordersSection.style.display = 'block';
    // Reinitialize orders panel
    await initOrdersPanel();
  }
};

export function initAdminPanel() {
  console.log('🔧 Initializing admin panel...');
  
  // Wait for DOM + form to exist
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
      setTimeout(checkForm, 100);  // Retry
    }
  };
  checkForm();
  
  // Load initial content based on current section
  if (currentAdminSection === 'menu') {
    loadAdminMenu();
  } else if (currentAdminSection === 'orders') {
    initOrdersPanel();
  }
}

async function updateMenuItem(itemId, form) {
  const formData = {
    name: document.getElementById('item-name').value.trim(),
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-desc').value.trim(),
    available: document.getElementById('item-available').checked
  };

  // Validation
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
      if (window.loadMenu) window.loadMenu(); // Refresh public menu
      form.reset();
      
      const submitBtn = document.querySelector('#menu-form button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = '➕ Add Item';
        delete submitBtn.dataset.editing;
      }
      
      showToast('✅ Item updated!');
    } else {
      const error = await res.json();
      showToast(error.error || 'Update failed', 'error');
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
}
