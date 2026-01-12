const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { User, Order, MenuItem, Ingredient } = require('../models');
const { Op } = require('sequelize');

// Protect ALL admin routes with both middleware
router.use(auth);      // First authenticate
router.use(adminAuth); // Then check if admin

// =====================================================
// DASHBOARD STATS
// =====================================================

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders count
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    // Today's revenue (exclude cancelled orders)
    // ✅ FIXED: Changed 'totalAmount' to 'total' to match Order model
    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: {
          [Op.gte]: today
        },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Pending orders count
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    // Total customers
    const totalUsers = await User.count({
      where: { role: 'customer' }
    });

    // Recent orders (last 10)
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue: parseFloat(todayRevenue).toFixed(2),
        pendingOrders,
        totalUsers,
        recentOrders
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching statistics' 
    });
  }
});

// =====================================================
// GET ALL ORDERS
// =====================================================

// GET /api/admin/all - Get all orders (admin only)
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'phone']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders' 
    });
  }
});

// =====================================================
// USER MANAGEMENT
// =====================================================

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, role } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role && ['customer', 'admin'].includes(role)) {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching users' 
    });
  }
});

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Order,
        limit: 10,
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching user details' 
    });
  }
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role. Must be "customer" or "admin"' 
      });
    }

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Prevent removing your own admin privileges
    if (user.id === req.userId && role !== 'admin') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot remove your own admin privileges' 
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating user role' 
    });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete recommended)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete your own account' 
      });
    }

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting user' 
    });
  }
});

// =====================================================
// SYSTEM INFO
// =====================================================

// GET /api/admin/system-info - Get system information
router.get('/system-info', async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalMenuItems = await MenuItem.count();
    const totalIngredients = await Ingredient.count();
    // ✅ FIXED: Changed 'totalAmount' to 'total' to match Order model
    const totalRevenue = await Order.sum('total', {
      where: { status: { [Op.ne]: 'cancelled' } }
    }) || 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalMenuItems,
        totalIngredients,
        totalRevenue: parseFloat(totalRevenue).toFixed(2),
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching system information' 
    });
  }
});

module.exports = router;