// src/components/admin/UsersPanel.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './UsersPanel.css';

export function UsersPanel(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details with order history
  const fetchUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const [userResponse, ordersResponse] = await Promise.all([
        axios.get(`http://localhost:5001/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5001/api/orders/customer/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setSelectedUser({
        ...userResponse.data.user,
        orders: ordersResponse.data.orders || []
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to load user details');
    }
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5001/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating role:', err);
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5001/api/admin/users/${userToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from local state
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="users-panel-loading">Loading users...</div>;
  }

  return (
    <div className="users-panel">
      <div className="users-panel-header">
        <h2>User Management</h2>
        <div className="users-stats">
          <span className="stat">
            Total: <strong>{users.length}</strong>
          </span>
          <span className="stat">
            Customers: <strong>{users.filter(u => u.role === 'customer').length}</strong>
          </span>
          <span className="stat">
            Admins: <strong>{users.filter(u => u.role === 'admin').length}</strong>
          </span>
        </div>
      </div>

      <div className="users-panel-content">
        {/* Left Side: User List */}
        <div className="users-list-section">
          <div className="users-filters">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="users-list">
            {filteredUsers.length === 0 ? (
              <div className="no-users">No users found</div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => fetchUserDetails(user.id)}
                >
                  <div className="user-card-header">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name} 
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="user-card-info">
                      <h4>{user.name}</h4>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="user-card-footer">
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                    <span className="user-auth-provider">
                      {user.authProvider === 'google' ? '🔐 Google' : '📧 Email'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: User Details */}
        <div className="user-details-section">
          {!selectedUser ? (
            <div className="no-selection">
              <p>Select a user to view details</p>
            </div>
          ) : (
            <div className="user-details">
              <div className="user-details-header">
                {selectedUser.profilePicture ? (
                  <img 
                    src={selectedUser.profilePicture} 
                    alt={selectedUser.name} 
                    className="user-details-avatar"
                  />
                ) : (
                  <div className="user-details-avatar-placeholder">
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="user-details-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  {selectedUser.phone && <p>📞 {selectedUser.phone}</p>}
                  {selectedUser.address && <p>📍 {selectedUser.address}</p>}
                </div>
              </div>

              {/* Role Management */}
              <div className="user-role-section">
                <h4>Role Management</h4>
                <div className="role-toggle">
                  <button
                    className={`role-btn ${selectedUser.role === 'customer' ? 'active' : ''}`}
                    onClick={() => updateUserRole(selectedUser.id, 'customer')}
                    disabled={selectedUser.role === 'customer'}
                  >
                    Customer
                  </button>
                  <button
                    className={`role-btn ${selectedUser.role === 'admin' ? 'active' : ''}`}
                    onClick={() => updateUserRole(selectedUser.id, 'admin')}
                    disabled={selectedUser.role === 'admin'}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Order History */}
              <div className="user-orders-section">
                <h4>Order History ({selectedUser.orders?.length || 0})</h4>
                {selectedUser.orders?.length === 0 ? (
                  <p className="no-orders">No orders yet</p>
                ) : (
                  <div className="orders-list">
                    {selectedUser.orders?.map(order => (
                      <div key={order.id} className="order-item">
                        <div className="order-item-header">
                          <span className="order-number">#{order.orderNumber}</span>
                          <span className={`order-status ${order.status}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-item-details">
                          <span className="order-date">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="order-total">${order.total}</span>
                        </div>
                        <div className="order-items-count">
                          {order.OrderItems?.length || 0} items
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete User */}
              <div className="user-actions">
                <button
                  className="delete-user-btn"
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setShowDeleteModal(true);
                  }}
                >
                  🗑️ Delete User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={deleteUser}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


