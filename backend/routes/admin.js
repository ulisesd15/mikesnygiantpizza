// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate, adminAuth } = require('../middleware/auth');
const { User, Order, MenuItem, Ingredient, OrderItem, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');


router.use(authenticate);
router.use(adminAuth);

const ACTIVE_ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];
const VALID_ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
const VALID_ORDER_TYPES = ['delivery', 'pickup'];

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getDateRange(startDate, endDate) {
  const createdAt = {};

  if (startDate) {
    createdAt[Op.gte] = new Date(startDate);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    createdAt[Op.lte] = end;
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
}


// DASHBOARD STATS

router.get('/stats', async (req, res) => {
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

    const todayRevenue = await Order.sum('totalPrice', {
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    }) || 0;

    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    const activeOrders = await Order.count({
      where: {
        status: {
          [Op.in]: ACTIVE_ORDER_STATUSES
        }
      }
    });

    res.json({
      success: true,
      data: {
        orders: {
          today: todayOrders,
          revenueToday: Number(todayRevenue).toFixed(2),
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

// GET ALL ORDERS


router.get('/all', async (req, res) => {
  try {
    console.log('📋 Getting all orders for admin:', req.user.email);

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;

    const { status, orderType, startDate, endDate } = req.query;
    const whereClause = {};

    if (status && VALID_ORDER_STATUSES.includes(status)) {
      whereClause.status = status;
    }

    if (orderType && VALID_ORDER_TYPES.includes(orderType)) {
      whereClause.orderType = orderType;
    }

    const createdAt = getDateRange(startDate, endDate);
    if (createdAt) {
      whereClause.createdAt = createdAt;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'category', 'size', 'price']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page,
          limit,
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

router.get('/users', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 50);
    const offset = (page - 1) * limit;
    const { role, search } = req.query;

    const whereClause = {};

    if (role && ['customer', 'admin'].includes(role)) {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: []
        }
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.count({ where: { userId: user.id } });
        return {
          ...user.toJSON(),
          orderCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
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

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'orders',
          separate: true,
          limit: 20,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              attributes: [
                'id',
                'menuItemId',
                'name',
                'quantity',
                'price',
                'addedToppings',
                'removedToppings'
              ],
              include: [
                {
                  model: MenuItem,
                  as: 'menuItem',
                  attributes: ['id', 'name', 'category', 'size']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const totalOrders = await Order.count({
      where: { userId: user.id }
    });

    const totalSpent = await Order.sum('totalPrice', {
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
          totalSpent: Number(totalSpent).toFixed(2),
          avgOrderValue: totalOrders > 0 ? (Number(totalSpent) / totalOrders).toFixed(2) : '0.00'
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

    if (Number(user.id) === Number(req.user?.id) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove your own admin privileges'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`✅ Admin ${req.user?.id} changed user ${user.email} role: ${oldRole} → ${role}`);

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

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user?.id)) {
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

    console.log(`✅ Admin ${req.user?.id} deleted user: ${userEmail}`);

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

router.get('/system-info', async (req, res) => {
  try {
    const [
      totalOrders,
      totalMenuItems,
      totalIngredients,
      pendingOrders,
      completedOrders,
      availableItems
    ] = await Promise.all([
      Order.count(),
      MenuItem.count(),
      Ingredient.count(),
      Order.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: 'completed' } }),
      MenuItem.count({ where: { isAvailable: true } })
    ]);

    const totalRevenue = await Order.sum('totalPrice', {
      where: {
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    let databaseSize = 'N/A';

    try {
      const dbSize = await sequelize.query(
        `
          SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
          FROM information_schema.tables
          WHERE table_schema = :dbName
        `,
        {
          replacements: { dbName: process.env.DB_NAME },
          type: sequelize.QueryTypes.SELECT
        }
      );

      databaseSize = dbSize[0]?.size_mb || 'N/A';
    } catch (dbError) {
      console.warn('⚠️ Could not fetch DB size:', dbError.message);
    }

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        menu: {
          totalItems: totalMenuItems,
          available: availableItems
        },
        inventory: {
          totalIngredients: totalIngredients
        },
        revenue: {
          total: Number(totalRevenue).toFixed(2)
        },
        database: {
          size: databaseSize,
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

// =====================================================
// ANALYTICS
// =====================================================

router.get('/summary', async (req, res) => {
  try {
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

    const todayRevenue = await Order.sum('totalPrice', {
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
        [fn('SUM', col('totalPrice')), 'revenue']
      ],
      group: ['orderType'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        todayOrders,
        todayRevenue: Number(todayRevenue).toFixed(2),
        avgOrderValue: todayOrders > 0 ? (Number(todayRevenue) / todayOrders).toFixed(2) : '0.00',
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

router.get('/sales/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const now = new Date();
    const startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        groupFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        break;
    }

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), groupFormat), 'period'],
        [fn('COUNT', col('id')), 'orderCount'],
        [fn('SUM', col('totalPrice')), 'revenue']
      ],
      group: [fn('DATE_FORMAT', col('createdAt'), groupFormat)],
      order: [[fn('DATE_FORMAT', col('createdAt'), groupFormat), 'ASC']],
      raw: true
    });

    const totalRevenue = orders.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalOrders = orders.reduce((sum, item) => sum + Number(item.orderCount || 0), 0);

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

router.get('/popular-items', async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 10);
    const period = req.query.period || 'month';

    const now = new Date();
    const startDate = new Date();

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
        break;
    }

    const popularItems = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        'name',
        [fn('SUM', col('OrderItem.quantity')), 'totalQuantity'],
        [literal('SUM(`OrderItem`.`quantity` * `OrderItem`.`price`)'), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('OrderItem.orderId'))), 'orderCount']
      ],
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'category', 'price', 'imageUrl', 'isAvailable'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            createdAt: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          }
        }
      ],
      group: ['OrderItem.menuItemId', 'OrderItem.name', 'menuItem.id'],
      order: [[literal('SUM(`OrderItem`.`quantity`)'), 'DESC']],
      limit,
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

router.get('/revenue', async (req, res) => {
  try {
    const totalRevenue = await Order.sum('totalPrice', {
      where: { status: { [Op.ne]: 'cancelled' } }
    }) || 0;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [monthRevenue, weekRevenue, todayRevenue, yesterdayRevenue] = await Promise.all([
      Order.sum('totalPrice', {
        where: {
          createdAt: { [Op.gte]: monthStart },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Order.sum('totalPrice', {
        where: {
          createdAt: { [Op.gte]: weekStart },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Order.sum('totalPrice', {
        where: {
          createdAt: { [Op.gte]: today },
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      Order.sum('totalPrice', {
        where: {
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          },
          status: { [Op.ne]: 'cancelled' }
        }
      })
    ]);

    const safeMonthRevenue = Number(monthRevenue || 0);
    const safeWeekRevenue = Number(weekRevenue || 0);
    const safeTodayRevenue = Number(todayRevenue || 0);
    const safeYesterdayRevenue = Number(yesterdayRevenue || 0);

    const todayGrowth = safeYesterdayRevenue > 0
      ? (((safeTodayRevenue - safeYesterdayRevenue) / safeYesterdayRevenue) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        total: Number(totalRevenue).toFixed(2),
        month: safeMonthRevenue.toFixed(2),
        week: safeWeekRevenue.toFixed(2),
        today: safeTodayRevenue.toFixed(2),
        yesterday: safeYesterdayRevenue.toFixed(2),
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

router.get('/categories', async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const startDate = new Date();

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
        break;
    }

    const categories = await OrderItem.findAll({
      attributes: [
        [col('menuItem.category'), 'category'],
        [fn('SUM', col('OrderItem.quantity')), 'totalQuantity'],
        [literal('SUM(`OrderItem`.`quantity` * `OrderItem`.`price`)'), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('OrderItem.orderId'))), 'orderCount']
      ],
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: [],
          required: true
        },
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            createdAt: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          }
        }
      ],
      group: ['menuItem.category'],
      order: [[literal('SUM(`OrderItem`.`quantity` * `OrderItem`.`price`)'), 'DESC']],
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