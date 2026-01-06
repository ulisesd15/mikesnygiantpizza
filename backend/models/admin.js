const express = require('express');
const router = express.Router();
const { User, Order, MenuItem } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get Dashboard Stats
router.get('/stats', [verifyToken, isAdmin], async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const totalMenuItems = await MenuItem.count();

    res.json({
      totalUsers,
      totalOrders,
      pendingOrders,
      totalMenuItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;