const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');

router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'customer', name, phone, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role, name, phone, address });
    res.status(201).json({
      message: 'User created',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod',
      { expiresIn: '24h' }
    );
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this to your backend auth router (UNCOMMENT + FIX):
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod');
    const user = await User.findByPk(decoded.id, { 
      attributes: ['id', 'email', 'role', 'name'] 
    });
    
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
