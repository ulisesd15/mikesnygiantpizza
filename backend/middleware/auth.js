// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Regular authentication middleware
async function authenticate(req, res, next) {
  console.log('🔐 Auth middleware called');
  console.log('  - Authorization header:', req.headers.authorization);
  
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'NONE');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or missing Bearer prefix');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 Token extracted (first 20 chars):', token.substring(0, 20) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('✅ Token decoded:', { userId: decoded.id, email: decoded.email, role: decoded.role });
      
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({ 
          success: false,
          error: 'User not found',
          message: 'Invalid token' 
        });
      }
      
      console.log('✅ User authenticated:', user.email, 'Role:', user.role);
      req.user = user;
      next();
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      console.error('   Error type:', err.name);
      console.error('   JWT_SECRET exists:', !!process.env.JWT_SECRET);
      console.error('   JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token',
        message: err.message 
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error' 
    });
  }
}


// Admin authentication middleware
function adminAuth(req, res, next) {
  console.log('🔒 Admin auth check for user:', req.user?.email, 'Role:', req.user?.role);
  console.log('🔍 Full req.user:', req.user);
  console.log('🔍 Route:', req.originalUrl);
  
  if (!req.user) {
    console.error('🚨 CRITICAL: authenticate middleware MISSING from route:', req.originalUrl);
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated - missing authenticate middleware' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required',
      currentRole: req.user.role 
    });
  }
  
  console.log('✅ Admin auth passed');
  next();
}


// Optional authentication (for guest orders)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as guest
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (err) {
      // Invalid token - continue as guest
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
}

module.exports = { authenticate, adminAuth, optionalAuth };
