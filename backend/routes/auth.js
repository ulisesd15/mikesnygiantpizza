// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, password, and name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Create user (password will be auto-hashed by model hook)
    const user = await User.create({ 
      email, 
      password,  // Don't hash here - the model will do it!
      name, 
      phone: phone || null, 
      address: address || null,
      role: 'customer' // Always customer for public registration
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
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
        error: 'Invalid credentials' 
      });
    }

    // Validate password using model method
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      message: 'Login successful', 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET PROFILE (Protected route)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No authentication token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod'
    );
    
    // Find user
    const user = await User.findByPk(decoded.id, { 
      attributes: ['id', 'email', 'role', 'name', 'phone', 'address'] 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('Profile error:', error);
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
      error: 'Server error' 
    });
  }
});

module.exports = router;
