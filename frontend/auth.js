// frontend/auth.js - CLIENT-SIDE auth (COMPLETE)
import { showToast } from './utils/cartStore.js'; 
// ✅ ADD THIS MISSING FUNCTION
export async function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user = await response.json();
        window.currentUser = user;
        updateAuthUI();
        return user;
      } else {
        localStorage.removeItem('token');
        window.currentUser = null;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }
  
  window.currentUser = null;
  updateAuthUI();
  return null;
}

// ... rest of your existing code (updateAuthUI, handleAuthSubmit, etc.)


export async function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  const adminBtn = document.getElementById('admin-tab-btn');  // ✅ Added
  
  if (!status) {
    console.warn('❌ user-info element not found');
    return;
  }
  
  if (window.currentUser) {
    // Logged in
    const displayName = window.currentUser.name || window.currentUser.email || 'User';
    const role = window.currentUser.role || 'customer';
    
    status.innerHTML = `👋 ${displayName} (${role.toUpperCase()})`;
    status.style.display = 'inline';
    
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
    }
    
    // ✅ ADMIN BUTTON LOGIC HERE
    const isAdmin = role === 'admin';
    if (adminBtn) {
      adminBtn.style.display = isAdmin ? 'block' : 'none';
      console.log(`⚙️ Admin button ${isAdmin ? 'SHOWN' : 'hidden'} for ${role}`);
    }
    
    console.log('✅ Auth UI updated for user:', displayName);
  } else {
    // Guest
    status.innerHTML = '👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button>';
    
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
    
    // ✅ Hide admin for guests
    if (adminBtn) {
      adminBtn.style.display = 'none';
    }
    
    console.log('✅ Auth UI set to guest mode');
  }
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('authChanged'));
}



// ✅ EXPORTED - Can be imported
export async function handleAuthSubmit(isRegister = false) {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  if (!email || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  try {
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.currentUser = data.user;
      updateAuthUI();
      window.hideAuth();
      showToast(`Welcome ${data.user.email}! 👋`);
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

// ✅ GLOBAL FUNCTIONS (for onclick)
window.handleAuthSubmit = handleAuthSubmit;  // Export → Global
window.showAuth = () => document.getElementById('auth-modal').style.display = 'block';
window.hideAuth = () => document.getElementById('auth-modal').style.display = 'none';
window.logout = () => {
  localStorage.removeItem('token');
  window.currentUser = null;
  updateAuthUI();
};
window.showForgotPassword = () => showToast('Contact Mike for password reset! 📞', 'info');
