
import { apiUrl } from './config.js';

export async function checkAuth() {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (!token) {
    window.currentUser = null;
    updateAuthUI();
    return null;
  }

  try {
    // Fast localStorage load first (optimistic UI)
    if (savedUser) {
      try {
        window.currentUser = JSON.parse(savedUser);
        updateAuthUI();
        console.log('✅ Loaded user from localStorage:', window.currentUser);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }

    // Backend validation
    const response = await apiUrl(API_ROUTES.profile);  // Handles token automatically
    
    if (response.ok) {
      const data = await response.json();
      window.currentUser = data.user || data;
      localStorage.setItem('user', JSON.stringify(window.currentUser));
      updateAuthUI();
      console.log('✅ Backend auth confirmed:', window.currentUser);
      return window.currentUser;
    } else {
      // Token invalid - full cleanup
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.currentUser = null;
      updateAuthUI();
      console.log('❌ Token invalid, cleared auth');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    // Network error - keep optimistic UI but don't trust token
    localStorage.removeItem('token');
    window.currentUser = null;
    updateAuthUI();
  }

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
    const displayName = window.currentUser.name || window.currentUser.email || 'User';
    const role = window.currentUser.role || 'customer';

    status.innerHTML = `👋 ${displayName} (${role.toUpperCase()})`;
    status.style.display = 'inline';

    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
    }

    const isAdmin = role === 'admin';
    if (adminBtn) {
      adminBtn.style.display = isAdmin ? 'block' : 'none';
      console.log(`⚙️ Admin button ${isAdmin ? 'SHOWN' : 'hidden'} for ${role}`);
    }

    console.log('✅ Auth UI updated for user:', displayName);
  } else {
    status.innerHTML =
      '👋 Guest - <button onclick="showAuth()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Login/Register</button>';

    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }

    if (adminBtn) {
      adminBtn.style.display = 'none';
    }

    console.log('✅ Auth UI set to guest mode');
  }

  window.dispatchEvent(new CustomEvent('authChanged'));
}

export async function handleAuthSubmit(isRegister = false) {
  console.log('🔐 Auth submit triggered:', { isRegister });

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('❌ Invalid email format', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('❌ Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const endpoint = isRegister
      ? apiUrl('/auth/register')
      : apiUrl('/auth/login');

    console.log('📡 Sending request to:', endpoint);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log('📥 Response:', { status: res.status, data });

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.currentUser = data.user;

      console.log('✅ User authenticated:', window.currentUser);
      console.log('✅ User saved to localStorage');

      await updateAuthUI();
      window.hideAuth();

      emailInput.value = '';
      passwordInput.value = '';

      const message = isRegister
        ? `Welcome ${data.user.name}! Account created.`
        : `Welcome ${data.user.name}! 👋`;
      showToast(message);
    } else {
      showToast(data.error || 'Authentication failed', 'error');
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    showToast('Authentication failed', 'error');
  }
}

export async function handleGoogleAuth(credential) {
  console.log('🔐 Google auth triggered');

  try {
    // No auth token needed for Google endpoint
    const res = await fetch(API_ROUTES.google, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: credential })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.currentUser = data.user;
      console.log('✅ Google user authenticated:', window.currentUser);

      await updateAuthUI();
      window.hideAuth();
      showToast(`Welcome ${data.user.name}! 🎉`);
      return data.user;  // Return for chaining
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
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  console.log('🔒 Auth modal closed');
};
window.logout = logout;
window.showForgotPassword = () => showToast('Contact Mike for password reset! 📞', 'info');

document.addEventListener('click', (e) => {
  const modal = document.getElementById('auth-modal');
  if (modal && e.target === modal) {
    window.hideAuth();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const modal = document.getElementById('auth-modal');
    if (modal && modal.style.display !== 'none') {
      handleAuthSubmit(false);
    }
  }
});
