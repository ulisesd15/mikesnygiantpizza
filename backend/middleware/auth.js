// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod';

// Required authentication - rejects if no valid token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional authentication - sets req.user if token exists, but allows request to continue without it
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user; // Set user if valid token
        }
      } catch (err) {
        // Invalid token, but we don't reject - just continue without user
        console.log('Optional auth: Invalid token, continuing as guest');
      }
    }
    
    // Continue regardless of whether user was set
    next();
  } catch (error) {
    // If any unexpected error, continue without user
    next();
  }
};

// Admin-only middleware (must be used after auth middleware)
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Export with aliases for consistency
module.exports = { 
  auth, 
  authenticate: auth,  // Alias for consistency with routes
  optionalAuth, 
  adminAuth 
};
