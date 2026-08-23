//frontend/config.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:5001/api' 
    : '/api');  // Proxy in prod

// Dynamic route factory
export const apiUrl = (route, params = {}) => {
  if (typeof route === 'string') return `${API_BASE}${route}`;
  return `${API_BASE}${route(params)}`;
};

// Static routes (relative paths → auto prefixed)
export const API_ROUTES = {
  // Auth  
  login: '/auth/login',
  register: '/auth/register',
  google: '/auth/google', 
  profile: '/auth/profile',
  
  // Menu
  menu: 'menu/menu',
  menuItem: (id) => `/menu/${id}`,
  menuCustomization: (id) => `/menu/${id}/customization`,
  
  // Orders
  myOrders: '/orders/my-orders',
  orders: '/orders',
  order: (id) => `/orders/${id}`,
  
  // Admin
  adminStats: '/admin/stats',
  adminAll: '/admin/all',
};