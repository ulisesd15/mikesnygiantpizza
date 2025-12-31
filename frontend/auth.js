// frontend/auth.js - CLIENT-SIDE auth (COMPLETE)
import { showToast } from './utils/cartStore.js';  // Import showToast

export async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const { user } = await res.json();
      window.currentUser = user;
      updateAuthUI();
      
      // Add admin tab if admin
      const tabs = document.querySelector('#tabs');
      if (user.role === 'admin' && !tabs.querySelector('[onclick="showTab(\'admin\')"]')) {
        tabs.innerHTML += '<button onclick="showTab(\'admin\')" class="tab-btn">⚙️ Admin Panel</button>';
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

export function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (window.currentUser) {
    status.innerHTML = `👋 ${window.currentUser.name || window.currentUser.email} (${window.currentUser.role.toUpperCase()})`;
    logoutBtn.style.display = 'inline-block';
  } else {
    status.innerHTML = '👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button>';
    logoutBtn.style.display = 'none';
  }
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
      if (data.user.role === 'admin') window.showTab('admin');
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
