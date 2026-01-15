// frontend/auth.js - CLIENT-SIDE auth with Google OAuth
import { showToast } from './utils/cartStore.js'; 

export async function checkAuth() {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  if (token) {
    try {
      // ✅ If user data exists in localStorage, use it immediately
      if (savedUser) {
        try {
          window.currentUser = JSON.parse(savedUser);
          updateAuthUI();
          console.log('✅ Loaded user from localStorage:', window.currentUser);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      }
      
      // Then verify with backend
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.currentUser = data.user || data;
        
        // ✅ Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(window.currentUser));
        
        updateAuthUI();
        return window.currentUser;
      } else {
        // Token invalid - clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

export async function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  const adminBtn = document.getElementById('admin-tab-btn');
  
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
    
    // ✅ ADMIN BUTTON LOGIC
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

// ✅ FIX: Properly capture form data and handle submission
export async function handleAuthSubmit(isRegister = false) {
  console.log('🔐 Auth submit triggered:', { isRegister });
  
  // ✅ GET VALUES FROM INPUT FIELDS
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  
  if (!emailInput || !passwordInput) {
    console.error('❌ Input fields not found!');
    showToast('Form error - refresh page', 'error');
    return;
  }
  
  const email = emailInput.value?.trim();
  const password = passwordInput.value?.trim();
  
  console.log('📝 Form data:', { email, password, isRegister });
  
  if (!email || !password) {
    showToast('❌ Please fill all fields', 'error');
    return;
  }
  
  // ✅ VALIDATE EMAIL
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('❌ Invalid email format', 'error');
    return;
  }
  
  // ✅ VALIDATE PASSWORD
  if (password.length < 6) {
    showToast('❌ Password must be at least 6 characters', 'error');
    return;
  }
  
  try {
    const endpoint = isRegister 
      ? 'http://localhost:5001/api/auth/register' 
      : 'http://localhost:5001/api/auth/login';
    
    console.log('📡 Sending request to:', endpoint);
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    console.log('📥 Response:', { status: res.status, data });
    
    if (res.ok) {
      // ✅ SUCCESS - Save BOTH token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // ✅ ADDED
      window.currentUser = data.user;
      
      console.log('✅ User authenticated:', window.currentUser);
      console.log('✅ User saved to localStorage');
      
      await updateAuthUI();
      window.hideAuth();
      
      // Clear form
      emailInput.value = '';
      passwordInput.value = '';
      
      const message = isRegister 
        ? `Welcome ${data.user.name}! Account created.` 
        : `Welcome ${data.user.name}! 👋`;
      showToast(message);
      
    } else {
      // ❌ FAILED
      showToast(data.error || 'Authentication failed', 'error');
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    showToast('Authentication failed', 'error');
  }
} // ✅ ADDED MISSING CLOSING BRACE

// ✅ GOOGLE OAUTH HANDLER
export async function handleGoogleAuth(credential) {
  console.log('🔐 Google auth triggered');
  
  try {
    // Send Google token to backend
    const res = await fetch('http://localhost:5001/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: credential })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // ✅ SUCCESS - Save BOTH token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // ✅ ADDED
      window.currentUser = data.user;
      console.log('✅ Google user authenticated:', window.currentUser);
      
      await updateAuthUI();
      window.hideAuth();
      showToast(`Welcome ${data.user.name}! 🎉`);
      
    } else {
      showToast(data.error || 'Google auth failed', 'error');
    }
  } catch (error) {
    console.error('❌ Google auth error:', error);
    showToast('Google authentication failed', 'error');
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.currentUser = null;
  updateAuthUI();
  showToast('Logged out successfully');
  window.location.reload();
}

// ✅ GLOBAL FUNCTIONS (for onclick)
window.handleAuthSubmit = handleAuthSubmit;
window.handleGoogleAuth = handleGoogleAuth;
window.showAuth = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'block';
  console.log('🔓 Auth modal opened');
};
window.hideAuth = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
  // ✅ CLEAR FORM WHEN CLOSING
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  console.log('🔒 Auth modal closed');
};
window.logout = logout; // ✅ FIXED: Use the actual logout function
window.showForgotPassword = () => showToast('Contact Mike for password reset! 📞', 'info');

// ✅ CLOSE MODAL ON OUTSIDE CLICK
document.addEventListener('click', (e) => {
  const modal = document.getElementById('auth-modal');
  if (modal && e.target === modal) {
    window.hideAuth();
  }
});

// ✅ HANDLE ENTER KEY IN FORM
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const modal = document.getElementById('auth-modal');
    if (modal && modal.style.display !== 'none') {
      // If in auth modal, trigger login
      handleAuthSubmit(false);
    }
  }
});
