// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { Order, OrderItem, MenuItem, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Protect all analytics routes (Admin only)
router.use(auth);
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

    // Today's revenue
    const todayRevenue = await Order.sum('totalAmount', {
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
      : 0;

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

    res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue: parseFloat(todayRevenue).toFixed(2),
        avgOrderValue,
        pendingOrders,
        ordersByStatus
      }
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
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
        startDate.setDate(now.getDate() - 7); // Default to week
    }

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate
        },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'orderCount'],
        [fn('SUM', col('totalAmount')), 'revenue']
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    const totalRevenue = orders.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0);
    const totalOrders = orders.reduce((sum, day) => sum + parseInt(day.orderCount || 0), 0);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        dailyBreakdown: orders
      }
    });

  } catch (error) {
    console.error('Error fetching sales data:', error);
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
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const popularItems = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('subtotal')), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('orderId'))), 'orderCount']
      ],
      include: [
        {
          model: MenuItem,
          attributes: ['id', 'name', 'category', 'price', 'imageUrl']
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
      group: ['menuItemId', 'MenuItem.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });

    res.json({
      success: true,
      data: {
        period,
        items: popularItems
      }
    });

  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching popular items' 
    });
  }
});

// GET /api/analytics/revenue - Revenue statistics
router.get('/revenue', async (req, res) => {
  try {
    // Total all-time revenue
    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: { [Op.ne]: 'cancelled' } }
    }) || 0;

    // This month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: { [Op.gte]: monthStart },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // This week's revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weekRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: { [Op.gte]: weekStart },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelled' }
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue).toFixed(2),
        monthRevenue: parseFloat(monthRevenue).toFixed(2),
        weekRevenue: parseFloat(weekRevenue).toFixed(2),
        todayRevenue: parseFloat(todayRevenue).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching revenue statistics' 
    });
  }
});

module.exports = router;
