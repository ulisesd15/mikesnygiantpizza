async function loadMenu() {
  const menu = await fetch('/api/menu').then(r => r.json());
  menuItems = menu;  
  renderMenu(menu, 'menu-grid');
  if (currentUser?.role === 'admin') renderAdminMenu(menu, 'admin-menu-grid');
  updateCartCount(); 
}

// Extract renderMenu, pizzaGroupCard, singleItemCard, loadMenu
export function renderMenuTab() { return `<div id="menu-grid">
    <!-- Public Menu Tab -->
      <div id="menu-tab" class="tab-content">
        <div id="menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          <div style="text-align: center; padding: 3rem; color: #666;">Loading menu...</div>
        </div>
      </div>
    </div>`; }
export async function loadMenu() { /* your loadMenu */ }
