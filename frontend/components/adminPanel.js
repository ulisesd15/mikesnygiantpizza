// adminPanel.js
export function renderAdminTab() {
  return `
    <div id="admin-tab" class="tab-content" style="display: none;">
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <h3 style="color: #333; margin-top: 0;">➕ Add New Menu Item</h3>
        <form id="menu-form">
          <input id="item-name" placeholder="Item Name (e.g. Giant Pepperoni)" class="input-style">
          <input id="item-price" type="number" step="0.01" placeholder="Price" class="input-style">
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
          <div>
            <label><input type="checkbox" id="item-available" checked> Available</label>
            <button type="submit" class="button-primary">Add Item</button>
          </div>
        </form>
      </div>
      <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;"></div>
    </div>
  `;
}

export async function addMenuItem(e) {
  e.preventDefault();
  const formData = {
    name: document.getElementById('item-name').value,
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-desc').value,
    available: document.getElementById('item-available').checked
  };

  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      window.loadMenu(); // Refresh menu
      e.target.reset();
      showToast('Item added successfully! 🍕');
    }
  } catch (error) {
    showToast('Failed to add item', 'error');
  }
}
