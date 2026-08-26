// backend/middleware/admin.js
// -------------------------------------------------------------
// Admin authorization middleware.
// This middleware checks whether the authenticated user has an
// admin role before allowing access to protected admin routes.
// It assumes that authentication middleware has already verified
// the user and attached the user object to req.user.
// -------------------------------------------------------------
const isAdmin = (req, res, next) => {
  try {
    // Check if user exists (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // User is admin, proceed to next middleware/route
    next();
    
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in authorization' 
    });
  }
};

module.exports = isAdmin;
