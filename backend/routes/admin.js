// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { User, Order, MenuItem, Ingredient, OrderItem } = require('../models');
const { Op, fn, col } = require('sequelize');

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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders count
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Today's revenue (exclude cancelled orders)
    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Pending orders count
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    // Active orders (pending, accepted, preparing, ready)
    const activeOrders = await Order.count({
      where: { 
        status: { 
          [Op.in]: ['pending', 'accepted', 'preparing', 'ready'] 
        } 
      }
    });

    // Total customers
    const totalUsers = await User.count({
      where: { role: 'customer' }
    });

    // Total admins
    const totalAdmins = await User.count({
      where: { role: 'admin' }
    });

    // Recent orders (last 10)
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderItem,
          attributes: ['id', 'name', 'quantity', 'price']
        }
      ]
    });

    // This week's stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: weekStart }
      }
    });

    const weekRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: weekStart },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        today: {
          orders: todayOrders,
          revenue: parseFloat(todayRevenue).toFixed(2)
        },
        week: {
          orders: weekOrders,
          revenue: parseFloat(weekRevenue).toFixed(2)
        },
        pending: pendingOrders,
        active: activeOrders,
        users: {
          customers: totalUsers,
          admins: totalAdmins,
          total: totalUsers + totalAdmins
        },
        recentOrders
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
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
    const { 
      page = 1, 
      limit = 20, 
      status, 
      orderType,
      startDate,
      endDate 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by status
    if (status && ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    // Filter by order type
    if (orderType && ['delivery', 'pickup'].includes(orderType)) {
      whereClause.orderType = orderType;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = end;
      }
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderItem,
          attributes: ['id', 'name', 'size', 'quantity', 'price']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
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
    const { 
      page = 1, 
      limit = 50, 
      role,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by role
    if (role && ['customer', 'admin'].includes(role)) {
      whereClause.role = role;
    }

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['password'],
        include: [
          [fn('COUNT', col('Orders.id')), 'orderCount']
        ]
      },
      include: [{
        model: Order,
        attributes: [],
        required: false
      }],
      group: ['User.id'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count.length, // Count is array when using GROUP BY
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching users' 
    });
  }
});

// GET /api/admin/users/:id - Get single user with order history
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Order,
        include: [{
          model: OrderItem,
          attributes: ['id', 'name', 'quantity', 'price']
        }],
        order: [['createdAt', 'DESC']],
        limit: 20
      }]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Calculate user stats
    const totalOrders = await Order.count({
      where: { userId: user.id }
    });

    const totalSpent = await Order.sum('total', {
      where: { 
        userId: user.id,
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalOrders,
          totalSpent: parseFloat(totalSpent).toFixed(2),
          avgOrderValue: totalOrders > 0 
            ? (totalSpent / totalOrders).toFixed(2) 
            : '0.00'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user:', error);
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

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`✅ Admin ${req.userId} changed user ${user.email} role: ${oldRole} → ${role}`);

    res.json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating user role' 
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
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

    const userEmail = user.email;
    await user.destroy();

    console.log(`✅ Admin ${req.userId} deleted user: ${userEmail}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
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
    const totalRevenue = await Order.sum('total', {
      where: { status: { [Op.ne]: 'cancelled' } }
    }) || 0;

    // Get database size (MySQL specific)
    const dbSize = await MenuItem.sequelize.query(
      `SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
       FROM information_schema.tables 
       WHERE table_schema = '${process.env.DB_NAME}'`,
      { type: MenuItem.sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: await Order.count({ where: { status: 'pending' } }),
          completed: await Order.count({ where: { status: 'completed' } })
        },
        menu: {
          totalItems: totalMenuItems,
          available: await MenuItem.count({ where: { isAvailable: true } })
        },
        inventory: {
          totalIngredients: totalIngredients
        },
        revenue: {
          total: parseFloat(totalRevenue).toFixed(2)
        },
        database: {
          size: dbSize[0]?.size_mb || 'N/A',
          name: process.env.DB_NAME
        },
        server: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching system info:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching system information' 
    });
  }
});

module.exports = router;
