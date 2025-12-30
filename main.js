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
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center;">
        <button onclick="showTab('menu')" class="tab-btn active">🍕 Public Menu</button>
        ${currentUser && currentUser.role === 'admin' ? '<button onclick="showTab(\'admin\')" class="tab-btn">⚙️ Admin Panel</button>' : ''}
      </div>

      <!-- Public Menu Tab -->
      <div id="menu-tab" class="tab-content">
        <div id="menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          <div style="text-align: center; padding: 3rem; color: #666;">Loading menu...</div>
        </div>
      </div>

      <!-- SHOPPING CART DRAWER -->
      <div id="cart-drawer" style="position: fixed; top: 0; right: -400px; width: 400px; height: 100vh; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.3); transition: right 0.3s; z-index: 1000; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin: 0; color: #ff6b35;">🛒 Shopping Cart</h2>
          <button onclick="toggleCart()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
        </div>
        <div id="cart-items" style="max-height: 60vh; overflow-y: auto;"></div>
        <div id="cart-total" style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #eee;">
          <h3 style="margin: 0 0 1rem;">Total: $<span id="cart-subtotal">0.00</span></h3>
          <button id="checkout-btn" class="button-primary" style="width: 100%;" onclick="checkout()">🚀 Checkout</button>
        </div>
      </div>

      <!-- CART BUTTON (Floating) -->
      <button id="cart-toggle" onclick="toggleCart()" style="position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px; background: #ff6b35; color: white; border: none; border-radius: 50%; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,53,0.4); z-index: 999;">🛒<span id="cart-count" style="position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">0</span></button>

      <!-- OVERLAY -->
      <div id="cart-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; display: none;" onclick="toggleCart()"></div>

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

function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const cartBtn = document.getElementById('cart-toggle');
  
  if (drawer.style.right === '0px') {
    drawer.style.right = '-400px';
    overlay.style.display = 'none';
    cartBtn.style.background = '#ff6b35';
  } else {
    drawer.style.right = '0px';
    overlay.style.display = 'block';
    cartBtn.style.background = '#28a745';
    renderCart();
  }
}

function addToCart(itemId) {
  const item = menuItems.find(i => i.id === parseInt(itemId));
  if (!item) return;
  
  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: itemId, quantity: 1, ...item });
  }
  
  localStorage.setItem('pizzaCart', JSON.stringify(cart));
  updateCartCount();
  showToast('Added to cart! 🛒');
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  
  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty 🍕</p>';
    subtotalEl.textContent = '0.00';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #eee;">
      <div>
        <h4 style="margin: 0 0 0.25rem;">${item.name} ${item.size ? `(${item.size})` : ''}</h4>
        <p style="margin: 0; color: #28a745; font-weight: bold;">$${item.price}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">−</button>
        <span style="min-width: 24px; text-align: center; font-weight: bold;">${item.quantity}</span>
        <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" style="width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
        <button onclick="removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer;">×</button>
        <span style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  `).join('');
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  subtotalEl.textContent = subtotal.toFixed(2);
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countEl = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (countEl) countEl.textContent = count;
  if (checkoutBtn) checkoutBtn.style.display = count > 0 ? 'block' : 'none';
}


function updateCartQuantity(itemId, quantity) {
  if (quantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  const item = cart.find(c => c.id === itemId);
  if (item) item.quantity = quantity;
  localStorage.setItem('pizzaCart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  localStorage.setItem('pizzaCart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 2rem; right: 2rem; background: #28a745; 
    color: white; padding: 1rem 2rem; border-radius: 8px; 
    z-index: 1001; transform: translateX(400px); transition: transform 0.3s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.transform = 'translateX(0)', 10);
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

function checkout() {
  if (cart.length === 0) return;
  alert(`Checkout: $${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} - Coming in Phase 6!`);
}


async function loadApp() {
  await fetch('/api/db-sync');
  document.getElementById('app').innerHTML = mainUI();
  setupEventListeners();
  loadMenu();
  checkAuth();
}

function setupEventListeners() {
  // Tab switching
  window.showTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    document.getElementById('menu-tab').style.display = tab === 'menu' ? 'block' : 'none';
    document.getElementById('admin-tab').style.display = tab === 'admin' ? 'block' : 'none';
  };

  // Menu form
  document.getElementById('menu-form').addEventListener('submit', addMenuItem);
}


async function loadMenu() {
  const menu = await fetch('/api/menu').then(r => r.json());
  menuItems = menu;  
  renderMenu(menu, 'menu-grid');
  if (currentUser?.role === 'admin') renderAdminMenu(menu, 'admin-menu-grid');
  updateCartCount(); 
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

loadApp().catch(console.error);
