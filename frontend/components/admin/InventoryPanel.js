// frontend/components/admin/InventoryPanel.js
import { showToast } from '../../utils/cartStore.js';

let currentInventoryPage = 1;
let inventoryPerPage = 20;
let currentInventorySearch = '';
let showLowStockOnly = false;

export function renderInventoryPanel() {
  return `
    <div id="inventory-panel">
      <!-- Low Stock Alert Banner -->
      <div id="low-stock-banner" style="display: none; background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(220,53,69,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-size: 2rem;">⚠️</span>
            <div>
              <strong style="font-size: 1.2rem;">Low Stock Alert!</strong><br>
              <span id="low-stock-count">0</span> items need to be reordered
            </div>
          </div>
          <button onclick="window.filterLowStock()" style="padding: 0.75rem 1.5rem; background: white; color: #dc3545; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            View Items
          </button>
        </div>
      </div>

      <!-- Header with Search and Actions -->
      <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;">
            <input 
              type="text" 
              id="inventory-search" 
              placeholder="🔍 Search ingredients..." 
              style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
            />
          </div>
          <button 
            onclick="window.searchInventory()" 
            style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
          >
            Search
          </button>
          <button 
            onclick="window.toggleInventoryForm()" 
            style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
          >
            ➕ Add Ingredient
          </button>
          <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; cursor: pointer;">
            <input type="checkbox" id="filter-low-stock" onchange="window.toggleLowStockFilter(this.checked)">
            <span style="font-weight: 600; color: #856404;">Low Stock Only</span>
          </label>
        </div>
      </div>

      <!-- Add/Edit Form (Hidden by default) -->
      <div id="inventory-form-container" style="display: none; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.5rem; color: #333;" id="form-title">➕ Add New Ingredient</h3>
        <form id="inventory-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <input id="ing-name" placeholder="Ingredient Name *" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;" required>
            <input id="ing-current-stock" type="number" placeholder="Current Stock *" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <input id="ing-reorder-level" type="number" placeholder="Reorder Level *" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;" required>
            <select id="ing-unit" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
              <option value="pieces">Pieces</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="liters">Liters</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="lbs">Pounds (lbs)</option>
              <option value="oz">Ounces (oz)</option>
              <option value="boxes">Boxes</option>
              <option value="bags">Bags</option>
            </select>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <input id="ing-unit-cost" type="number" step="0.01" placeholder="Unit Cost ($)" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
            <input id="ing-supplier" placeholder="Supplier (optional)" class="input-style" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="submit" class="button-primary" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;">
              ✅ Save Ingredient
            </button>
            <button type="button" id="cancel-inventory-btn" onclick="window.cancelInventoryEdit()" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Inventory Grid -->
      <div id="inventory-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 3rem; color: #666;">Loading inventory...</div>
      </div>
      
      <!-- Pagination -->
      <div id="inventory-pagination" style="margin-top: 1.5rem; text-align: center;"></div>
    </div>
  `;
}

export async function initInventoryPanel() {
  console.log('🔧 Initializing Inventory Panel...');
  
  // Setup event listeners
  const searchInput = document.getElementById('inventory-search');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.searchInventory();
    });
  }
  
  // Setup form
  const form = document.getElementById('inventory-form');
  if (form) {
    form.onsubmit = handleInventoryFormSubmit;
  }
  
  // Load initial data
  await loadInventory();
  await checkLowStock();
}

async function loadInventory() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in', 'error');
      return;
    }

    const params = new URLSearchParams({
      page: currentInventoryPage,
      limit: inventoryPerPage
    });
    
    if (currentInventorySearch) params.append('search', currentInventorySearch);
    if (showLowStockOnly) params.append('lowStock', 'true');

    const res = await fetch(`http://localhost:5001/api/inventory?${params}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Failed to load inventory');

    const data = await res.json();
    
    if (data.success) {
      renderInventoryGrid(data.data.ingredients);
      renderInventoryPagination(data.data.pagination);
      
      // Update low stock banner
      if (data.data.lowStockCount > 0) {
        document.getElementById('low-stock-banner').style.display = 'block';
        document.getElementById('low-stock-count').textContent = data.data.lowStockCount;
      } else {
        document.getElementById('low-stock-banner').style.display = 'none';
      }
    }

  } catch (error) {
    console.error('Error loading inventory:', error);
    document.getElementById('inventory-grid').innerHTML = 
      '<div style="text-align: center; padding: 3rem; color: #dc3545; grid-column: 1/-1;">⚠️ Failed to load inventory</div>';
  }
}

async function checkLowStock() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5001/api/inventory/low-stock', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data.count > 0) {
        document.getElementById('low-stock-banner').style.display = 'block';
        document.getElementById('low-stock-count').textContent = data.data.count;
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
}

function getStockStatus(ingredient) {
  const { currentStock, reorderLevel } = ingredient;
  
  if (currentStock === 0) {
    return { color: '#dc3545', label: 'OUT OF STOCK', icon: '🚫' };
  } else if (currentStock <= reorderLevel) {
    return { color: '#ffc107', label: 'LOW STOCK', icon: '⚠️' };
  } else if (currentStock <= reorderLevel * 1.5) {
    return { color: '#17a2b8', label: 'RUNNING LOW', icon: '🔵' };
  } else {
    return { color: '#28a745', label: 'IN STOCK', icon: '✅' };
  }
}

function renderInventoryGrid(ingredients) {
  const container = document.getElementById('inventory-grid');
  
  if (!ingredients || ingredients.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666; grid-column: 1/-1;">No ingredients found</div>';
    return;
  }

  container.innerHTML = ingredients.map(ing => {
    const status = getStockStatus(ing);
    const totalValue = (parseFloat(ing.unitCost || 0) * ing.currentStock).toFixed(2);
    
    return `
      <div class="inventory-card" style="position: relative; background: white; border: 2px solid ${status.color}; border-radius: 12px; padding: 1.5rem; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Status Badge -->
        <div style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem; background: ${status.color}; color: white; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
          ${status.icon} ${status.label}
        </div>
        
        <!-- Ingredient Info -->
        <h3 style="color: #007bff; margin: 0 0 1rem; padding-right: 6rem;">${ing.name}</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem;">
          <div>
            <strong style="color: #666;">Current Stock:</strong><br>
            <span style="font-size: 1.5rem; font-weight: 700; color: ${status.color};">${ing.currentStock}</span>
            <span style="color: #666;"> ${ing.unit}</span>
          </div>
          <div>
            <strong style="color: #666;">Reorder Level:</strong><br>
            <span style="font-size: 1.2rem; font-weight: 600; color: #666;">${ing.reorderLevel}</span>
            <span style="color: #666;"> ${ing.unit}</span>
          </div>
        </div>
        
        ${ing.unitCost ? `
          <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
              <span style="color: #666;">Unit Cost:</span>
              <strong style="color: #28a745;">$${parseFloat(ing.unitCost).toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 0.25rem;">
              <span style="color: #666;">Total Value:</span>
              <strong style="color: #007bff;">$${totalValue}</strong>
            </div>
          </div>
        ` : ''}
        
        ${ing.supplier ? `<p style="margin: 0.5rem 0; color: #666; font-size: 0.85rem;"><strong>Supplier:</strong> ${ing.supplier}</p>` : ''}
        
        <!-- Quick Adjust Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1rem 0;">
          <button onclick="window.adjustStock(${ing.id}, -10)" style="padding: 0.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            -10
          </button>
          <button onclick="window.adjustStock(${ing.id}, -1)" style="padding: 0.5rem; background: #ffc107; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            -1
          </button>
          <button onclick="window.adjustStock(${ing.id}, 1)" style="padding: 0.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            +1
          </button>
          <button onclick="window.adjustStock(${ing.id}, 10)" style="padding: 0.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            +10
          </button>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
          <button onclick="window.editIngredient(${ing.id})" style="flex: 1; padding: 0.5rem; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            ✏️ Edit
          </button>
          <button onclick="window.deleteIngredient(${ing.id})" style="flex: 1; padding: 0.5rem; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderInventoryPagination(pagination) {
  const container = document.getElementById('inventory-pagination');
  if (!pagination) return;
  
  const { page, totalPages } = pagination;
  
  let paginationHTML = '<div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">';
  
  if (page > 1) {
    paginationHTML += `<button onclick="window.changeInventoryPage(${page - 1})" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">← Previous</button>`;
  }
  
  paginationHTML += `<span style="padding: 0.5rem 1rem; color: #666;">Page ${page} of ${totalPages}</span>`;
  
  if (page < totalPages) {
    paginationHTML += `<button onclick="window.changeInventoryPage(${page + 1})" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">Next →</button>`;
  }
  
  paginationHTML += '</div>';
  container.innerHTML = paginationHTML;
}

async function handleInventoryFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const editingId = submitBtn?.dataset.editing;
  
  const formData = {
    name: document.getElementById('ing-name').value.trim(),
    currentStock: parseInt(document.getElementById('ing-current-stock').value),
    reorderLevel: parseInt(document.getElementById('ing-reorder-level').value),
    unit: document.getElementById('ing-unit').value,
    unitCost: parseFloat(document.getElementById('ing-unit-cost').value) || 0,
    supplier: document.getElementById('ing-supplier').value.trim() || null
  };

  if (!formData.name) {
    showToast('Ingredient name is required', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const url = editingId 
      ? `http://localhost:5001/api/inventory/${editingId}`
      : 'http://localhost:5001/api/inventory';
    
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save ingredient');
    }

    showToast(`✅ Ingredient ${editingId ? 'updated' : 'added'} successfully!`);
    form.reset();
    delete submitBtn.dataset.editing;
    document.getElementById('form-title').textContent = '➕ Add New Ingredient';
    document.getElementById('inventory-form-container').style.display = 'none';
    
    await loadInventory();
    await checkLowStock();

  } catch (error) {
    console.error('Error saving ingredient:', error);
    showToast(error.message, 'error');
  }
}

// Global functions
window.searchInventory = () => {
  const searchInput = document.getElementById('inventory-search');
  currentInventorySearch = searchInput?.value || '';
  currentInventoryPage = 1;
  loadInventory();
};

window.changeInventoryPage = (page) => {
  currentInventoryPage = page;
  loadInventory();
};

window.toggleLowStockFilter = (checked) => {
  showLowStockOnly = checked;
  currentInventoryPage = 1;
  loadInventory();
};

window.filterLowStock = () => {
  document.getElementById('filter-low-stock').checked = true;
  showLowStockOnly = true;
  currentInventoryPage = 1;
  loadInventory();
};

window.toggleInventoryForm = () => {
  const container = document.getElementById('inventory-form-container');
  const isHidden = container.style.display === 'none';
  container.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    document.getElementById('inventory-form').reset();
    const submitBtn = document.querySelector('#inventory-form button[type="submit"]');
    if (submitBtn) delete submitBtn.dataset.editing;
    document.getElementById('form-title').textContent = '➕ Add New Ingredient';
  }
};

window.cancelInventoryEdit = () => {
  document.getElementById('inventory-form-container').style.display = 'none';
  document.getElementById('inventory-form').reset();
};

window.editIngredient = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/inventory/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load ingredient');

    const data = await res.json();
    const ing = data.data;

    // Show form
    document.getElementById('inventory-form-container').style.display = 'block';
    document.getElementById('form-title').textContent = `✏️ Edit: ${ing.name}`;
    
    // Fill form
    document.getElementById('ing-name').value = ing.name;
    document.getElementById('ing-current-stock').value = ing.currentStock;
    document.getElementById('ing-reorder-level').value = ing.reorderLevel;
    document.getElementById('ing-unit').value = ing.unit;
    document.getElementById('ing-unit-cost').value = ing.unitCost || '';
    document.getElementById('ing-supplier').value = ing.supplier || '';
    
    // Set editing mode
    const submitBtn = document.querySelector('#inventory-form button[type="submit"]');
    if (submitBtn) submitBtn.dataset.editing = id;
    
    // Scroll to form
    document.getElementById('inventory-form-container').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error loading ingredient:', error);
    showToast('Failed to load ingredient', 'error');
  }
};

window.deleteIngredient = async (id) => {
  if (!confirm('⚠️ Delete this ingredient? This cannot be undone!')) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/inventory/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to delete ingredient');

    showToast('🗑️ Ingredient deleted successfully');
    await loadInventory();
    await checkLowStock();

  } catch (error) {
    console.error('Error deleting ingredient:', error);
    showToast('Failed to delete ingredient', 'error');
  }
};

window.adjustStock = async (id, adjustment) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/inventory/${id}/adjust`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        adjustment,
        reason: adjustment > 0 ? 'Stock in' : 'Stock out'
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to adjust stock');
    }

    showToast(`✅ Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`);
    await loadInventory();
    await checkLowStock();

  } catch (error) {
    console.error('Error adjusting stock:', error);
    showToast(error.message, 'error');
  }
};