// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, MenuItem, sequelize } = require('../models');
const { authenticate, optionalAuth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// ========================================
// CREATE ORDER
// ========================================
// POST /api/orders - Create new order
router.post('/', optionalAuth, async (req, res) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
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
    if (!customerName || !customerEmail || !customerPhone) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'Customer name, email, and phone are required' 
      });
    }

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

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const orderData = {
      orderNumber,
      userId: req.user ? req.user.id : null,
      customerName,
      customerEmail,
      customerPhone,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      deliveryInstructions: deliveryInstructions || null,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      status: 'pending',
      subtotal,
      tax,
      deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
      total,
      estimatedTime: estimatedTime || 35
    };

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

    // ✅ COMMIT TRANSACTION
    await transaction.commit();

    // ✅ FETCH COMPLETE ORDER AFTER COMMIT
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log('✅ Order created:', createdOrder.orderNumber);

    // ✅ RETURN SUCCESS - DON'T ROLLBACK HERE
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder
    });

  } catch (error) {
    // ✅ ONLY ROLLBACK IF TRANSACTION EXISTS AND ISN'T FINISHED
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    
    console.error('Error creating order:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create order',
      details: error.message
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
// ========================================
// GET USER'S ORDERS
// ========================================
// GET /api/orders/user - Get logged-in user's orders
router.get('/user', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
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
// GET /api/orders/:id - Get single order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check if user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
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
// ADMIN: GET ALL ORDERS
// ========================================
// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = status ? { status } : {};

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: { orders }
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

// ========================================
// ADMIN: UPDATE ORDER STATUS
// ========================================
// PATCH /api/orders/:id/status - Update order status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status' 
      });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    order.status = status;
    await order.save();

    console.log(`✅ Order #${order.id} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order status' 
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
