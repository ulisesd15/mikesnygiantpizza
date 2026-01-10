// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, MenuItem } = require('../models');
const { authenticate, optionalAuth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// ========================================
// CREATE ORDER
// ========================================
// POST /api/orders - Create a new order (works for both logged-in and guest users)
router.post('/', optionalAuth, async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const {
      orderType,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      items,
      subtotal,
      tax,
      deliveryFee,
      total,
      estimatedTime
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'Order must contain at least one item' 
      });
    }
    
    if (!orderType || !['delivery', 'pickup'].includes(orderType)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'Valid order type required (delivery or pickup)' 
      });
    }
    
    if (orderType === 'delivery' && !deliveryAddress) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'Delivery address required for delivery orders' 
      });
    }

    // Validate all menu items exist and are available
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          error: `Menu item with ID ${item.menuItemId} not found` 
        });
      }
      if (!menuItem.isAvailable) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          error: `${menuItem.name} is currently unavailable` 
        });
      }
    }

    // Create order
    const orderData = {
      userId: req.user ? req.user.id : null,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      deliveryInstructions,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      status: 'pending',
      subtotal,
      tax,
      deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
      total,
      estimatedTime: estimatedTime || 35
    };

    // Add guest info if not logged in
    if (!req.user) {
      orderData.guestName = customerName;
      orderData.guestEmail = customerEmail;
      orderData.guestPhone = customerPhone;
    }

    const order = await Order.create(orderData, { transaction });

    // Create order items
    const orderItems = items.map(item => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      name: item.name,
      size: item.size || null,
      price: item.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || null
    }));

    await OrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    // Fetch complete order with items
    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem }]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order' 
    });
  }
});

// ========================================
// GET USER'S ORDERS
// ========================================
// GET /api/orders/my-orders - Get current user's order history (with pagination)
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }],
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
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders' 
    });
  }
});

// Alias for backwards compatibility
router.get('/', authenticate, async (req, res) => {
  req.url = '/my-orders';
  return router.handle(req, res);
});

// ========================================
// GET SINGLE ORDER
// ========================================
// GET /api/orders/:id - Get specific order details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }, {
        model: User,
        attributes: ['id', 'name', 'email', 'phone'],
        required: false
      }]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check permissions
    if (req.user) {
      if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }
    }

    res.json({ 
      success: true,
      order 
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order' 
    });
  }
});

// ========================================
// ADMIN ROUTES
// ========================================

// GET /api/orders/admin/all - Get all orders with filters (admin only)
router.get('/admin/all', authenticate, adminAuth, async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20,
      startDate,
      endDate,
      orderType,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by order type
    if (orderType) {
      whereClause.orderType = orderType;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = end;
      }
    }

    // Search functionality
    const include = [{
      model: OrderItem,
      include: [{ model: MenuItem }]
    }];

    if (search) {
      include.push({
        model: User,
        attributes: ['id', 'name', 'email', 'phone'],
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        },
        required: false
      });
    } else {
      include.push({
        model: User,
        attributes: ['id', 'name', 'email', 'phone'],
        required: false
      });
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include,
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
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders' 
    });
  }
});

// GET /api/orders/admin/pending - Get all pending orders (admin only)
router.get('/admin/pending', authenticate, adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: 'pending' },
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }, {
        model: User,
        attributes: ['id', 'name', 'email', 'phone'],
        required: false
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({ 
      success: true,
      orders 
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders' 
    });
  }
});

// GET /api/orders/customer/:userId - Get customer's orders (admin only)
router.get('/customer/:userId', authenticate, adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.params.userId },
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching customer orders' 
    });
  }
});

// PATCH /api/orders/:id/status - Update order status (admin only)
router.patch('/:id/status', authenticate, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
        required: false
      }]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Prevent status changes on completed/cancelled orders
    if (order.status === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot change status of a cancelled order' 
      });
    }

    if (order.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot change status of a completed order' 
      });
    }

    order.status = status;
    await order.save();

    // Fetch updated order with all details
    const updatedOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }, {
        model: User,
        attributes: ['id', 'name', 'email', 'phone'],
        required: false
      }]
    });

    res.json({ 
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order' 
    });
  }
});

// PATCH /api/orders/:id/accept - Accept a pending order
router.patch('/:id/accept', authenticate, adminAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Only pending orders can be accepted' 
      });
    }

    order.status = 'accepted';
    await order.save();

    res.json({ 
      success: true,
      message: 'Order accepted',
      order 
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to accept order' 
    });
  }
});

// PATCH /api/orders/:id/cancel - Cancel an order
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Allow user to cancel their own order or admin to cancel any
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Only allow cancellation of certain statuses
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ 
        success: false,
        error: `Cannot cancel order with status: ${order.status}` 
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ 
      success: true,
      message: 'Order cancelled',
      order 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel order' 
    });
  }
});

module.exports = router;
