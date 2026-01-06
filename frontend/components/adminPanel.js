// adminPanel.js - ADMIN ONLY + FULL CRUD
import { showToast } from '../utils/cartStore.js';

export function renderAdminTab() {
  return `
    <div id="admin-tab" class="tab-content" style="display: none;">
      <!-- Header -->
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 2rem;">⚙️ Admin Panel</h2>
        <p style="margin: 0.5rem 0 0; opacity: 0.9;">Manage menu items</p>
      </div>

      <!-- Add Form -->
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <h3 style="color: #333; margin-top: 0;">➕ Add New Menu Item</h3>
        <form id="menu-form">
          <input id="item-name" placeholder="Item Name (e.g. Giant Pepperoni)" class="input-style">
          <input id="item-price" type="number" step="0.01" placeholder="Price ($)" class="input-style">
          <select id="item-category" class="input-style">
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
          <textarea id="item-desc" placeholder="Description (optional)" class="input-style" style="height: 80px;"></textarea>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="checkbox" id="item-available" checked> Available
            </label>
            <button type="submit" class="button-primary" style="flex: 1;">➕ Add Item</button>
          </div>
        </form>
      </div>

      <!-- Admin Menu Grid -->
      <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 3rem; color: #666;">Loading admin menu...</div>
      </div>
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
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      window.loadMenu(); // Refresh public menu
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

// 🔥 NEW: Load admin menu grid
export async function loadAdminMenu() {
  if (!window.currentUser || window.currentUser.role !== 'admin') {
    document.getElementById('admin-menu-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #dc3545;">🔐 Admin access required</div>';
    return;
  }

  try {
    const res = await fetch('/api/menu', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      const items = await res.json();
      renderAdminMenuGrid(items);
    }
  } catch (error) {
    document.getElementById('admin-menu-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #666;">⚠️ Failed to load admin menu</div>';
  }
}

function renderAdminMenuGrid(items) {
  const container = document.getElementById('admin-menu-grid');
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;">No menu items yet</div>';
    return;
  }
  
  container.innerHTML = items.map(item => adminMenuCard(item)).join('');
}

function adminMenuCard(item) {
  return `
    <div class="menu-card admin-card" style="position: relative;">
      <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
        <button class="btn-sm edit-btn" onclick="editMenuItem(${item.id})" title="Edit">✏️</button>
        <button class="btn-sm delete-btn" onclick="deleteMenuItem(${item.id})" title="Delete">🗑️</button>
      </div>
      <h3 style="color: #007bff;">${item.emoji || '🍕'} ${item.name}</h3>
      <p style="color: #666;">$${item.price.toFixed(2)} • ${item.category.toUpperCase()}</p>
      ${item.description ? `<p style="color: #888; font-size: 0.9rem;">${item.description}</p>` : ''}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
        <label><input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleItemAvailability(${item.id}, this.checked)"> Available</label>
      </div>
    </div>
  `;
}

// 🔥 ADMIN CRUD FUNCTIONS
window.editMenuItem = async (itemId) => {
  const item = await fetch(`/api/menu/${itemId}`).then(r => r.json());
  if (item) {
    // Populate form
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-desc').value = item.description || '';
    document.getElementById('item-available').checked = item.available;
    
    // Change form to EDIT mode
    const submitBtn = document.querySelector('#menu-form button[type="submit"]');
    submitBtn.textContent = '💾 Update Item';
    submitBtn.dataset.editing = itemId;
    
    showToast(`Editing item #${itemId}`);
    window.showTab('admin');
  }
};

window.deleteMenuItem = async (itemId) => {
  if (!confirm('Delete this menu item?')) return;
  
  try {
    const res = await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      loadAdminMenu();  // Refresh grid
      showToast('🗑️ Item deleted!');
    }
  } catch (error) {
    showToast('Delete failed', 'error');
  }
};

window.toggleItemAvailability = async (itemId, available) => {
  try {
    const res = await fetch(`/api/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available })
    });
    if (res.ok) {
      showToast(available ? '✅ Item now available' : '⏸️ Item hidden');
      loadAdminMenu();
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
};


export function initAdminPanel() {
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
}


async function updateMenuItem(itemId, form) {
  const formData = {
    name: document.getElementById('item-name').value,
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-desc').value,
    available: document.getElementById('item-available').checked
  };

  try {
    const res = await fetch(`/api/menu/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      loadAdminMenu();
      form.reset();
      document.querySelector('#menu-form button[type="submit"]').textContent = '➕ Add Item';
      delete submitBtn.dataset.editing;
      showToast('✅ Item updated!');
    }
  } catch (error) {
    showToast('Update failed', 'error');
  }
}
