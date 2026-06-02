import { apiUrl } from './config.js';

function showToast(message, type = 'info') {
  if (window.showToast && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }

  console[type === 'error' ? 'error' : 'log'](message);
  alert(message);
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function checkAuth() {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (!token) {
    window.currentUser = null;
    await updateAuthUI();
    return null;
  }

  if (savedUser) {
    try {
      window.currentUser = JSON.parse(savedUser);
      await updateAuthUI();
    } catch {
      localStorage.removeItem('user');
    }
  }

  try {
    const res = await fetch(apiUrl('/auth/profile'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await safeJson(res);

    if (!res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.currentUser = null;
      await updateAuthUI();
      return null;
    }

    window.currentUser = data.user || data;
    localStorage.setItem('user', JSON.stringify(window.currentUser));
    await updateAuthUI();

    return window.currentUser;
  } catch (error) {
    console.error('Auth check failed:', error);
    return window.currentUser || null;
  }
}

export async function updateAuthUI() {
  const status = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  const adminBtn = document.getElementById('admin-tab-btn');

  if (!status) return;

  if (window.currentUser) {
    const displayName =
      window.currentUser.name ||
      window.currentUser.full_name ||
      window.currentUser.email ||
      'User';

    const role = window.currentUser.role || 'customer';

    status.innerHTML = `👋 ${displayName} (${role.toUpperCase()})`;

    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (adminBtn) adminBtn.style.display = role === 'admin' ? 'block' : 'none';
  } else {
    status.innerHTML = `
      👋 Guest -
      <button onclick="showAuth()" style="background:#007bff;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
        Login/Register
      </button>
    `;

    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
  }

  window.dispatchEvent(new CustomEvent('authChanged'));
}

export async function handleAuthSubmit(isRegister = false) {
  console.log('🔐 Auth submit triggered:', { isRegister });

  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');

  if (!emailInput || !passwordInput) {
    showToast('Form error - refresh page', 'error');
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    const endpoint = isRegister ? apiUrl('/auth/register') : apiUrl('/auth/login');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      showToast(data.error || data.message || 'Invalid email or password', 'error');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.currentUser = data.user;

    await updateAuthUI();
    window.hideAuth?.();

    emailInput.value = '';
    passwordInput.value = '';

    const displayName = data.user?.name || data.user?.full_name || data.user?.email || 'User';
    showToast(`Welcome ${displayName}! 👋`);
  } catch (error) {
    console.error('Auth error:', error);
    showToast('Authentication failed. Check your backend server.', 'error');
  }
}

export async function handleGoogleAuth(credential) {
  try {
    const res = await fetch(apiUrl('/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: credential }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      showToast(data.error || data.message || 'Google auth failed', 'error');
      return null;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.currentUser = data.user;

    await updateAuthUI();
    window.hideAuth?.();

    const displayName = data.user?.name || data.user?.full_name || data.user?.email || 'User';
    showToast(`Welcome ${displayName}! 🎉`);

    return data.user;
  } catch (error) {
    console.error('Google auth error:', error);
    showToast('Google authentication failed', 'error');
    return null;
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
window.logout = logout;

window.showAuth = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'block';
};

window.hideAuth = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';

  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');

  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
};

window.showForgotPassword = () => {
  showToast('Contact Mike for password reset! 📞', 'info');
};

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