// backend/routes/auth.js
// -------------------------------------------------------------
// Authentication routes.
// Handles customer registration, local login, Google login,
// profile retrieval, profile updates, password changes, logout,
// and token verification. Successful login returns a JWT containing
// the user's id, email, and role, which is used by middleware to
// protect customer and admin routes.
// -------------------------------------------------------------

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');

const router = express.Router();

const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================
// Helper Functions
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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// ============================================
// Register Local User
// ============================================

router.post('/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Important:
    // Do NOT manually hash here if the User model already hashes
    // passwords in the beforeCreate hook.
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: 'customer',
      authProvider: 'local'
    });

    console.log('✅ New user registered:', email);

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('❌ Registration error:', error);

    return res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// ============================================
// Login Local User
// ============================================

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google Sign-In. Please login with Google.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '');

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ User logged in:', email);

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('❌ Login error:', error);

    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ============================================
// Google OAuth Login
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

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: 'Google Client ID is not configured on the server'
      });
    }

    console.log('🔐 Verifying Google token...');

    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const googleEmail = normalizeEmail(payload.email);
    const googleName = payload.name || googleEmail;
    const googleId = payload.sub;
    const profilePicture = payload.picture || null;

    if (!googleEmail || !googleId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google account information'
      });
    }

    console.log('✅ Google user verified:', {
      googleEmail,
      googleName,
      googleId
    });

    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: googleEmail },
          { googleId }
        ]
      }
    });

    if (!user) {
      console.log('👤 Creating new Google user...');

      user = await User.create({
        email: googleEmail,
        name: googleName,
        googleId,
        authProvider: 'google',
        profilePicture,
        password: null,
        role: 'customer'
      });
    } else {
      const updates = {};

      if (!user.googleId) updates.googleId = googleId;
      if (!user.profilePicture && profilePicture) updates.profilePicture = profilePicture;

      // Keep this as google if the account has no local password.
      // If the user already had a local password, this still links Google,
      // but does not remove the existing password.
      if (!user.password) updates.authProvider = 'google';

      if (Object.keys(updates).length > 0) {
        console.log('🔗 Updating existing user with Google account data...');
        await user.update(updates);
      }
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);

    return res.status(401).json({
      success: false,
      error: error.message || 'Google authentication failed'
    });
  }
});

// ============================================
// Get Profile
// ============================================

router.get('/profile', authenticate, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// ============================================
// Update Profile
// ============================================

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          error: 'Name cannot be empty'
        });
      }

      req.user.name = trimmedName;
    }

    if (phone !== undefined) {
      req.user.phone = phone ? String(phone).trim() : null;
    }

    if (address !== undefined) {
      req.user.address = address ? String(address).trim() : null;
    }

    await req.user.save();

    console.log('✅ Profile updated for:', req.user.email);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// ============================================
// Change Password
// ============================================

router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.authProvider === 'google' && !req.user.password) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change password for Google-only accounts'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const isValidPassword = await bcrypt.compare(
      String(currentPassword),
      req.user.password || ''
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Important:
    // Do NOT manually hash here if the User model hashes passwords
    // in the beforeUpdate hook.
    req.user.password = String(newPassword);
    req.user.authProvider = 'local';

    await req.user.save();

    console.log('✅ Password changed for:', req.user.email);

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Password change error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// ============================================
// Logout
// ============================================

router.post('/logout', (req, res) => {
  console.log('👋 User logged out');

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================
// Verify Token
// ============================================

router.get('/verify', authenticate, async (req, res) => {
  return res.json({
    success: true,
    valid: true,
    user: formatUserResponse(req.user)
  });
});

module.exports = router;