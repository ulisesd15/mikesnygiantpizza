// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate, adminAuth } = require('../middleware/auth');
const { User, Order, MenuItem, Ingredient, OrderItem } = require('../models');
const { Op, fn, col } = require('sequelize');



// =====================================================
// DASHBOARD STATS
// =====================================================

// GET /api/admin/stats - Dashboard statistics (ADMIN ONLY)
router.get('/stats', authenticate, adminAuth, async (req, res) => {
  try {
    console.log('📊 Getting admin stats for:', req.user.email);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    const activeOrders = await Order.count({
      where: { 
        status: { 
          [Op.in]: ['pending', 'accepted', 'preparing', 'ready'] 
        } 
      }
    });

    // ✅ EXACT FORMAT FRONTEND EXPECTS
    res.json({
      success: true,
      data: {
        orders: {
          today: todayOrders,
          revenueToday: parseFloat(todayRevenue).toFixed(2),
          active: activeOrders,
          pending: pendingOrders
        }
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

// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', authenticate, adminAuth, async (req, res) => {
  try {
    console.log('📋 Getting all orders for admin:', req.user.email);
    
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
  include: [
    { model: User, as: 'User' }
  ],
  limit: parseInt(limit),
  offset: (parseInt(page) - 1) * parseInt(limit),
  order: [['createdAt', 'DESC']]
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


//ANALYTICS//
// Protect all analytics routes (Admin only)
router.use(authenticate);
router.use(adminAuth);

// GET /api/analytics/summary - Today's summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Today's revenue (FIXED: use 'total' instead of 'totalAmount')
    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Average order value today
    const avgOrderValue = todayOrders > 0 
      ? (todayRevenue / todayOrders).toFixed(2)
      : '0.00';

    // Pending orders
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    // Orders by status today
    const ordersByStatus = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Orders by type today
    const ordersByType = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      attributes: [
        'orderType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total')), 'revenue']
      ],
      group: ['orderType'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        todayOrders,
        todayRevenue: parseFloat(todayRevenue).toFixed(2),
        avgOrderValue,
        pendingOrders,
        ordersByStatus,
        ordersByType
      }
    });

  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching summary data' 
    });
  }
});

// GET /api/analytics/sales/:period - Sales by period
router.get('/sales/:period', async (req, res) => {
  try {
    const { period } = req.params; // day, week, month, year
    const now = new Date();
    let startDate = new Date();
    let groupFormat;

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        groupFormat = '%Y-%m-%d %H:00:00'; // Group by hour
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        groupFormat = '%Y-%m-%d';
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        groupFormat = '%Y-%m-%d';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        groupFormat = '%Y-%m-%d';
    }

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate
        },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), groupFormat), 'period'],
        [fn('COUNT', col('id')), 'orderCount'],
        [fn('SUM', col('total')), 'revenue']
      ],
      group: [fn('DATE_FORMAT', col('createdAt'), groupFormat)],
      order: [[fn('DATE_FORMAT', col('createdAt'), groupFormat), 'ASC']],
      raw: true
    });

    const totalRevenue = orders.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
    const totalOrders = orders.reduce((sum, item) => sum + parseInt(item.orderCount || 0), 0);

    res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        summary: {
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders,
          avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'
        },
        breakdown: orders
      }
    });

  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching sales data' 
    });
  }
});

// GET /api/analytics/popular-items - Top selling items
router.get('/popular-items', async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const popularItems = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        'name',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', fn('*', col('quantity'), col('price'))), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('OrderItem.orderId'))), 'orderCount']
      ],
      include: [
        {
          model: MenuItem,
          attributes: ['id', 'name', 'category', 'price', 'imageUrl', 'isAvailable'],
          required: false
        },
        {
          model: Order,
          attributes: [],
          where: {
            createdAt: {
              [Op.gte]: startDate
            },
            status: { [Op.ne]: 'cancelled' }
          }
        }
      ],
      group: ['OrderItem.menuItemId', 'OrderItem.name', 'MenuItem.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: parseInt(limit),
      subQuery: false
    });

    res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        items: popularItems
      }
    });

  } catch (error) {
    console.error('❌ Error fetching popular items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching popular items' 
    });
  }
});

// GET /api/analytics/revenue - Revenue statistics
router.get('/revenue', async (req, res) => {
  try {
    // Total all-time revenue (FIXED: use 'total')
    const totalRevenue = await Order.sum('total', {
      where: { status: { [Op.ne]: 'cancelled' } }
    }) || 0;

    // This month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: monthStart },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // This week's revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weekRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: weekStart },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Yesterday's revenue
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayRevenue = await Order.sum('total', {
      where: {
        createdAt: { 
          [Op.gte]: yesterday,
          [Op.lt]: today
        },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Calculate growth percentages
    const todayGrowth = yesterdayRevenue > 0 
      ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        total: parseFloat(totalRevenue).toFixed(2),
        month: parseFloat(monthRevenue).toFixed(2),
        week: parseFloat(weekRevenue).toFixed(2),
        today: parseFloat(todayRevenue).toFixed(2),
        yesterday: parseFloat(yesterdayRevenue).toFixed(2),
        growth: {
          todayVsYesterday: `${todayGrowth}%`
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching revenue stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching revenue statistics' 
    });
  }
});

// GET /api/analytics/categories - Sales by category
router.get('/categories', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const categories = await OrderItem.findAll({
      attributes: [
        [col('MenuItem.category'), 'category'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', fn('*', col('quantity'), col('price'))), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('OrderItem.orderId'))), 'orderCount']
      ],
      include: [
        {
          model: MenuItem,
          attributes: [],
          required: true
        },
        {
          model: Order,
          attributes: [],
          where: {
            createdAt: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          }
        }
      ],
      group: ['MenuItem.category'],
      order: [[fn('SUM', fn('*', col('quantity'), col('price'))), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        period,
        categories
      }
    });

  } catch (error) {
    console.error('❌ Error fetching category analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching category analytics' 
    });
  }
});

module.exports = router;
