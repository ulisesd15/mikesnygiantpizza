// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User } = require('../models');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');

// ✅ Initialize Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================
// 🔐 HELPER FUNCTIONS
// ============================================
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    role: user.role,
    authProvider: user.authProvider,
    profilePicture: user.profilePicture
  };
}

// ============================================
// 📝 REGISTER (Local Auth)
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role: 'customer',
      authProvider: 'local'
    });

    console.log('✅ New user registered:', email);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// ============================================
// 🔑 LOGIN (Local Auth)
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is OAuth-only (no password set)
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google Sign-In. Please login with Google.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ User logged in:', email);

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ============================================
// 🔐 GOOGLE OAUTH LOGIN
// ============================================
router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Google token is required' 
      });
    }
    
    console.log('🔐 Verifying Google token...');
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleName = payload.name;
    const googleId = payload.sub;
    const profilePicture = payload.picture;
    
    console.log('✅ Google user verified:', { googleEmail, googleName, googleId });
    
    // Check if user exists by email OR googleId
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email: googleEmail },
          { googleId: googleId }
        ]
      } 
    });
    
    if (!user) {
      // Create new user
      console.log('👤 Creating new Google user...');
      user = await User.create({
        email: googleEmail,
        name: googleName,
        googleId: googleId,
        authProvider: 'google',
        profilePicture: profilePicture,
        password: null,
        role: 'customer'
      });
    } else if (!user.googleId) {
      // Link existing email account to Google
      console.log('🔗 Linking existing user to Google...');
      await user.update({
        googleId: googleId,
        authProvider: 'google',
        profilePicture: profilePicture || user.profilePicture
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: formatUserResponse(user)
    });
    
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(401).json({ 
      success: false,
      error: error.message || 'Google authentication failed' 
    });
  }
});

// ============================================
// 👤 GET PROFILE (Protected Route)
// ============================================
router.get('/profile', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// ============================================
// 🔄 UPDATE PROFILE (Protected Route)
// ============================================
router.put('/profile', async (req, res) => {
  try {
    // Extract token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    const { name, phone, address } = req.body;
    
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// ============================================
// 🔑 CHANGE PASSWORD (Protected Route)
// ============================================
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is OAuth (can't change password)
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change password for Google accounts'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log('✅ Password changed for:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// ============================================
// 🚪 LOGOUT (Client-side only, but endpoint for logging)
// ============================================
router.post('/logout', (req, res) => {
  console.log('👋 User logged out');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================
// ✅ VERIFY TOKEN (Quick token check)
// ============================================
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        valid: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false
    });
  }
});

module.exports = router;
