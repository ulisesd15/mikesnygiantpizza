// frontend/components/admin/UsersPanel.js
import { showToast } from '../../utils/cartStore.js';

let currentUsersPage = 1;
let usersPerPage = 20;
let currentRoleFilter = '';
let currentSearchQuery = '';

export function renderUsersPanel() {
  return `
    <div id="users-panel">
      <!-- Header with Search and Filter -->
      <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;">
            <input 
              type="text" 
              id="users-search" 
              placeholder="🔍 Search by name or email..." 
              style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
            />
          </div>
          <select 
            id="users-role-filter" 
            style="padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
          <button 
            onclick="window.searchUsers()" 
            style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
          >
            Search
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card" style="border-left: 4px solid #007bff;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Total Users</p>
          <h3 id="users-total-count" style="margin: 0.5rem 0 0; color: #007bff; font-size: 1.8rem;">...</h3>
        </div>
        <div class="stat-card" style="border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Customers</p>
          <h3 id="users-customer-count" style="margin: 0.5rem 0 0; color: #28a745; font-size: 1.8rem;">...</h3>
        </div>
        <div class="stat-card" style="border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Admins</p>
          <h3 id="users-admin-count" style="margin: 0.5rem 0 0; color: #ffc107; font-size: 1.8rem;">...</h3>
        </div>
      </div>

      <!-- Users Table -->
      <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 1.5rem; color: #333;">👥 User Management</h3>
        <div id="users-table-container">
          <p style="text-align: center; color: #666; padding: 2rem;">Loading users...</p>
        </div>
        
        <!-- Pagination -->
        <div id="users-pagination" style="margin-top: 1.5rem; text-align: center;"></div>
      </div>

      <!-- User Detail Modal -->
      <div id="user-detail-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; padding: 2rem; position: relative;">
          <button onclick="window.closeUserDetailModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">×</button>
          <div id="user-detail-content"></div>
        </div>
      </div>
    </div>
  `;
}

export async function initUsersPanel() {
  console.log('🔧 Initializing Users Panel...');
  
  // Setup event listeners
  const searchInput = document.getElementById('users-search');
  const roleFilter = document.getElementById('users-role-filter');
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.searchUsers();
    });
  }
  
  if (roleFilter) {
    roleFilter.addEventListener('change', () => window.searchUsers());
  }
  
  // Load initial data
  await loadUsers();
}

async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in', 'error');
      return;
    }

    // Build query params
    const params = new URLSearchParams({
      page: currentUsersPage,
      limit: usersPerPage
    });
    
    if (currentRoleFilter) params.append('role', currentRoleFilter);

    const res = await fetch(`http://localhost:5001/api/admin/users?${params}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to load users');
    }

    const data = await res.json();
    
    if (data.success) {
      renderUsersTable(data.data.users);
      renderUsersPagination(data.data.pagination);
      updateUserStats(data.data.users, data.data.pagination.total);
    }

  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('users-table-container').innerHTML = 
      '<p style="text-align: center; color: #dc3545; padding: 2rem;">⚠️ Failed to load users</p>';
  }
}

function renderUsersTable(users) {
  const container = document.getElementById('users-table-container');
  
  if (!users || users.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No users found</p>';
    return;
  }

  const tableHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="padding: 1rem; text-align: left; font-weight: 600;">ID</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Name</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Email</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Role</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Phone</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr style="border-bottom: 1px solid #dee2e6; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
              <td style="padding: 1rem;">${user.id}</td>
              <td style="padding: 1rem; font-weight: 500;">${user.name || 'N/A'}</td>
              <td style="padding: 1rem;">${user.email}</td>
              <td style="padding: 1rem;">
                <span style="padding: 0.25rem 0.75rem; background: ${user.role === 'admin' ? '#ffc107' : '#007bff'}; color: white; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                  ${user.role === 'admin' ? '👑 Admin' : '👤 Customer'}
                </span>
              </td>
              <td style="padding: 1rem;">${user.phone || 'N/A'}</td>
              <td style="padding: 1rem; text-align: center;">
                <button onclick="window.viewUserDetail(${user.id})" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">View</button>
                <button onclick="window.toggleUserRole(${user.id}, '${user.role}')" style="padding: 0.5rem 1rem; background: #ffc107; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">Change Role</button>
                <button onclick="window.deleteUser(${user.id})" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tableHTML;
}

function renderUsersPagination(pagination) {
  const container = document.getElementById('users-pagination');
  if (!pagination) return;
  
  const { page, totalPages } = pagination;
  
  let paginationHTML = '<div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">';
  
  // Previous button
  if (page > 1) {
    paginationHTML += `<button onclick="window.changeUsersPage(${page - 1})" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">← Previous</button>`;
  }
  
  // Page numbers
  paginationHTML += `<span style="padding: 0.5rem 1rem; color: #666;">Page ${page} of ${totalPages}</span>`;
  
  // Next button
  if (page < totalPages) {
    paginationHTML += `<button onclick="window.changeUsersPage(${page + 1})" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">Next →</button>`;
  }
  
  paginationHTML += '</div>';
  container.innerHTML = paginationHTML;
}

function updateUserStats(users, total) {
  document.getElementById('users-total-count').textContent = total;
  
  const customers = users.filter(u => u.role === 'customer').length;
  const admins = users.filter(u => u.role === 'admin').length;
  
  document.getElementById('users-customer-count').textContent = customers;
  document.getElementById('users-admin-count').textContent = admins;
}

// Global functions
window.searchUsers = () => {
  const searchInput = document.getElementById('users-search');
  const roleFilter = document.getElementById('users-role-filter');
  
  currentSearchQuery = searchInput?.value || '';
  currentRoleFilter = roleFilter?.value || '';
  currentUsersPage = 1;
  
  loadUsers();
};

window.changeUsersPage = (page) => {
  currentUsersPage = page;
  loadUsers();
};

window.viewUserDetail = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load user details');

    const data = await res.json();
    const user = data.data;

    const modalContent = `
      <h2 style="margin: 0 0 1.5rem; color: #007bff;">👤 User Details</h2>
      <div style="margin-bottom: 1rem;">
        <strong>ID:</strong> ${user.id}<br>
        <strong>Name:</strong> ${user.name || 'N/A'}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>Phone:</strong> ${user.phone || 'N/A'}<br>
        <strong>Role:</strong> <span style="padding: 0.25rem 0.75rem; background: ${user.role === 'admin' ? '#ffc107' : '#007bff'}; color: white; border-radius: 12px; font-size: 0.85rem;">${user.role}</span><br>
        <strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}
      </div>
      
      ${user.Orders && user.Orders.length > 0 ? `
        <h3 style="margin: 1.5rem 0 1rem; color: #333;">Recent Orders</h3>
        <div style="max-height: 300px; overflow-y: auto;">
          ${user.Orders.map(order => `
            <div style="padding: 1rem; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 0.5rem;">
              <strong>Order #${order.orderNumber || order.id}</strong><br>
              Status: ${order.status}<br>
              Total: $${parseFloat(order.total).toFixed(2)}<br>
              Date: ${new Date(order.createdAt).toLocaleDateString()}
            </div>
          `).join('')}
        </div>
      ` : '<p style="color: #666; margin-top: 1rem;">No orders yet</p>'}
    `;

    document.getElementById('user-detail-content').innerHTML = modalContent;
    document.getElementById('user-detail-modal').style.display = 'flex';

  } catch (error) {
    console.error('Error loading user details:', error);
    showToast('Failed to load user details', 'error');
  }
};

window.closeUserDetailModal = () => {
  document.getElementById('user-detail-modal').style.display = 'none';
};

window.toggleUserRole = async (userId, currentRole) => {
  const newRole = currentRole === 'admin' ? 'customer' : 'admin';
  const confirmMsg = `Change user role to ${newRole.toUpperCase()}?`;
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update role');
    }

    showToast(`✅ User role changed to ${newRole}`);
    loadUsers();

  } catch (error) {
    console.error('Error updating user role:', error);
    showToast(error.message, 'error');
  }
};

window.deleteUser = async (userId) => {
  if (!confirm('⚠️ Delete this user? This cannot be undone!')) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    showToast('🗑️ User deleted successfully');
    loadUsers();

  } catch (error) {
    console.error('Error deleting user:', error);
    showToast(error.message, 'error');
  }
};