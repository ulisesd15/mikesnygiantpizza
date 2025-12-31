document.title = 'Mike\'s NY Giant Pizza - Stage 4 Menu';

let currentUser = null;
let token = null;


let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
let menuItems = [];  // Store full menu for cart lookup



function mainUI() {
  return `
    <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
      <header style="text-align: center; margin-bottom: 3rem;">
        <h1 style="color: #ff6b35; font-size: 3rem; margin: 0;">🍕 Mike's NY Giant Pizza</h1>
        <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px; margin-top: 1rem;">
          <h2>✅ STAGE 4: Menu Management Complete!</h2>
          <p>Admin CRUD | Public menu | JWT protected</p>
        </div>
      </header>

      <!-- Auth Status -->
      <div id="auth-status" style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <span id="user-info">👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button></span>
        <button id="logout-btn" onclick="logout()" style="display: none; background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 1rem;">Logout</button>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; flex-wrap: wrap;">
        <button onclick="showTab('menu')" class="tab-btn active">🍕 Public Menu</button>
        <button onclick="showTab('orders')" class="tab-btn">📋 My Orders</button>
        ${currentUser && currentUser.role === 'admin' ? '<button onclick="showTab(\'admin\')" class="tab-btn">⚙️ Admin Panel</button>' : ''}
      </div>


      

      <!-- My Orders Tab -->
      <div id="orders-tab" class="tab-content" style="display: none;">
        <div style="text-align: center; padding: 2rem; background: #f0f8ff; border-radius: 12px; margin-bottom: 2rem;">
          <h2 style="color: #28a745;">📋 My Orders</h2>
          <p>Your order history appears here</p>
        </div>
        <div id="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem;">
          <div style="text-align: center; padding: 3rem; color: #666;">No orders yet - place one above! 🍕</div>
        </div>
      </div>


      
      <!-- Admin Panel Tab -->
      <div id="admin-tab" class="tab-content" style="display: none;">
        <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
          <h3 style="color: #333; margin-top: 0;">➕ Add New Menu Item</h3>
          <form id="menu-form">
            <input id="item-name" placeholder="Item Name (e.g. Giant Pepperoni)" style="input-style">
            <input id="item-price" type="number" step="0.01" placeholder="Price" style="input-style">
            <select id="item-category" style="input-style">
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
            <textarea id="item-desc" placeholder="Description (optional)" style="input-style; height: 80px;"></textarea>
            <div>
              <label><input type="checkbox" id="item-available" checked> Available</label>
              <button type="submit" style="button-primary">Add Item</button>
            </div>
          </form>
        </div>
        <div id="admin-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;"></div>
      </div>

      <!-- Auth Modal -->
      <div id="auth-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="background: white; margin: 10% auto; padding: 2rem; border-radius: 12px; max-width: 400px; position: relative;">
          <button onclick="hideAuth()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
          <!-- Auth form here -->
        </div>
      </div>
    </div>

    <style>
      .tab-btn { padding: 1rem 2rem; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.3s; }
      .tab-btn.active { background: #ff6b35; color: white; }
      .tab-content { animation: fadeIn 0.3s; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .input-style { width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
      .button-primary { background: #28a745; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
      .menu-card { border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; }
      .menu-card:hover { transform: translateY(-4px); }
      .admin-card { border: 2px solid #007bff; }
      .admin-card .edit-btn { background: #007bff; }
      .admin-card .delete-btn { background: #dc3545; }
      .btn-sm { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; color: white; margin: 0.25rem; font-size: 0.9rem; }
      .order-card:hover { transform: translateY(-2px); }

      
      .size-selector {
        width: 100%; 
        padding: 0.75rem; 
        border: 2px solid #ff6b35; 
        border-radius: 8px; 
        background: white; 
        font-size: 1rem;
        font-weight: 500;
      }
      .add-to-cart-btn {
        transition: background 0.3s;
      }
      .add-to-cart-btn:hover {
        background: #e55a2b !important;
      }
      </style>
  `;
}


// Orders Tab Functions
async function loadOrders() {
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

function renderOrders(orders, containerId) {
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
    <div class="menu-card" style="border-left: 5px solid #28a745;">
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


async function loadApp() {
  await fetch('/api/db-sync');
  document.getElementById('app').innerHTML = mainUI();
  setupEventListeners();
  loadMenu();
  checkAuth();
  showTab('menu');
}




function setupEventListeners() {
  window.showTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    document.getElementById('menu-tab').style.display = tab === 'menu' ? 'block' : 'none';
    document.getElementById('orders-tab').style.display = tab === 'orders' ? 'block' : 'none';
    document.getElementById('admin-tab').style.display = tab === 'admin' ? 'block' : 'none';
    
    if (tab === 'orders') loadOrders(); // Load orders when tab opens
  };

  document.getElementById('menu-form').addEventListener('submit', addMenuItem);
}








function renderMenu(items, containerId) {
  const pizzaGroups = {};
  const nonPizzas = [];
  
  items.forEach(item => {
    if (item.category === 'pizza') {
      const key = `${item.name}|${item.description}`;
      if (!pizzaGroups[key]) pizzaGroups[key] = [];
      pizzaGroups[key].push(item);
    } else {
      nonPizzas.push(item);
    }
  });

  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #ff6b35;">🍕 PIZZA SELECTION</h2>
      <p>Choose pizza type, then select size!</p>
    </div>
    ${Object.values(pizzaGroups).map(group => pizzaGroupCard(group)).join('')}
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f0f8ff; border-radius: 12px; margin: 2rem 0;">
      <h2 style="color: #007bff;">🥪 OTHER ITEMS</h2>
    </div>
    ${nonPizzas.map(item => singleItemCard(item)).join('')}
  `;
}



function pizzaGroupCard(sizes) {
  const baseName = sizes[0].name;
  const description = sizes[0].description;
  
  return `
    <div class="menu-card" style="grid-column: span 1;">
      <h3 style="color: #ff6b35; margin: 0 0 0.5rem;">${baseName}</h3>
      <p style="color: #666; margin: 0 0 1rem;">${description}</p>
      
      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Size:</label>
        <select class="size-selector" data-group-id="${sizes[0].id}" onchange="updatePizzaPrice(this)">
          ${sizes.map(size => `
            <option value="${size.id}" data-price="${size.price}">
              ${size.size} - $${size.price}
            </option>
          `).join('')}
        </select>
      </div>
      
      <p id="pizza-price-${sizes[0].id}" style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 1rem 0;">
        $${sizes.find(s => s.size === '16"')?.price || sizes[0].price}
      </p>
      
      <button class="add-to-cart-btn" data-group-id="${sizes[0].id}" 
        onclick="addToCartPizza(this)"
        style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}

function singleItemCard(item) {
  return `
    <div class="menu-card">
      <h3 style="color: #007bff; margin: 0 0 0.5rem;">${item.name} <span style="font-size: 0.8em; color: #666;">${item.size}</span></h3>
      <p style="color: #666; margin: 0 0 0.5rem; text-transform: uppercase; font-size: 0.9rem;">${item.category}</p>
      <p style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 0.5rem 0;">$${item.price}</p>
      ${item.description ? `<p style="color: #888; margin: 1rem 0 0;">${item.description}</p>` : ''}
      <button onclick="addToCart(${item.id})" style="width: 100%; background: #28a745; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}

function updatePizzaPrice(select) {
  const groupId = select.dataset.groupId;
  const priceEl = document.getElementById(`pizza-price-${groupId}`);
  const selectedOption = select.options[select.selectedIndex];
  priceEl.textContent = `$${parseFloat(selectedOption.dataset.price).toFixed(2)}`;
}

function addToCartPizza(btn) {
  const groupId = btn.dataset.groupId;
  const sizeSelect = document.querySelector(`.size-selector[data-group-id="${groupId}"]`);
  const selectedItemId = sizeSelect.value;
  addToCart(selectedItemId);
}




function renderAdminMenu(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => adminMenuCard(item)).join('');
}

function menuCard(item) {
  return `
    <div class="menu-card">
      <h3 style="color: #ff6b35;">${item.name} <span style="font-size: 0.8em; color: #666;">${item.size}</span></h3>
      <p style="color: #666;">${item.category.toUpperCase()}</p>
      <p style="font-size: 2rem; color: #28a745; font-weight: bold;">$${item.price}</p>
      ${item.description ? `<p style="color: #888;">${item.description}</p>` : ''}
      <button onclick="addToCart(${item.id})" style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem;">
        ➕ Add to Cart
      </button>
    </div>
  `;
}


function adminMenuCard(item) {
  return `
    <div class="menu-card admin-card">
      <h3 style="color: #007bff;">${item.name}</h3>
      <p>$${item.price} | ${item.category} | ${item.isAvailable ? '✅' : '❌'}</p>
      ${item.description ? `<small>${item.description}</small>` : ''}
      <div style="margin-top: 1rem;">
        <button class="btn-sm edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="btn-sm delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </div>
    </div>
  `;
}

async function addMenuItem(e) {
  e.preventDefault();
  const formData = {
    name: document.getElementById('item-name').value,
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-desc').value,
    isAvailable: document.getElementById('item-available').checked
  };

  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });

  if (res.ok) {
    alert('Item added!');
    document.getElementById('menu-form').reset();
    loadMenu();
  } else {
    alert('Error adding item');
  }
}

async function deleteItem(id) {
  if (confirm('Delete this item?')) {
    await fetch(`/api/menu/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadMenu();
  }
}

// Auth functions (from Stage 3)
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const { user } = await res.json();
        currentUser = user;
        token = token;
        updateAuthUI();
      }
    } catch {}
  }
}

function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  if (currentUser) {
    status.innerHTML = `👋 ${currentUser.name || currentUser.email} (${currentUser.role.toUpperCase()})`;
    logoutBtn.style.display = 'inline';
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  token = null;
  updateAuthUI();
  loadMenu();
}


window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.updateCartCount = updateCartCount;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.showToast = showToast;
window.checkout = checkout;
window.showOrderConfirmation = showOrderConfirmation;
window.loadOrders = loadOrders;
window.renderOrders = renderOrders;
window.orderCard = orderCard;
window.addToCartPizza = addToCartPizza;
window.updatePizzaPrice = updatePizzaPrice;
window



loadApp().catch(console.error);
