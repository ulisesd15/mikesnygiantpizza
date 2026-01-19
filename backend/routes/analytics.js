// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const { authenticate, adminAuth } = require('../middleware/auth');
const { Order, OrderItem, MenuItem, User } = require('../models');
const { Op, fn, col } = require('sequelize');

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
