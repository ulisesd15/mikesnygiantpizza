// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, MenuItem } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

// ========================================
// CREATE ORDER
// ========================================
// POST /api/orders - Create a new order (works for both logged-in and guest users)
router.post('/', optionalAuth, async (req, res) => {
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
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (!orderType || !['delivery', 'pickup'].includes(orderType)) {
      return res.status(400).json({ error: 'Valid order type required (delivery or pickup)' });
    }
    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address required for delivery orders' });
    }

    // Create order
    const orderData = {
      userId: req.user ? req.user.id : null, // Logged-in user or null for guest
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

    const order = await Order.create(orderData);

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

    await OrderItem.bulkCreate(orderItems);

    // Fetch complete order with items
    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem }]
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: createdOrder
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ========================================
// GET USER'S ORDERS
// ========================================
// GET /api/orders - Get current user's order history
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
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
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has permission to view this order
    if (req.user) {
      // Logged-in users can view their own orders or if they're admin
      if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // Guest users - we'll allow this for now (could add email verification)
      // In production, you might want to send an email link with a token
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ========================================
// ADMIN: GET ALL PENDING ORDERS
// ========================================
// GET /api/orders/admin/pending - Get all pending orders (admin only)
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orders = await Order.findAll({
      where: { status: 'pending' },
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }, {
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ========================================
// ADMIN: GET ALL ORDERS (WITH FILTERS)
// ========================================
// GET /api/orders/admin/all - Get all orders with optional status filter
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.query;
    const where = status ? { status } : {};

    const orders = await Order.findAll({
      where,
      include: [{
        model: OrderItem,
        include: [{ model: MenuItem }]
      }, {
        model: User,
        attributes: ['id', 'name', 'email'],
        required: false // Include guest orders (where userId is null)
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ========================================
// ADMIN: UPDATE ORDER STATUS
// ========================================
// PATCH /api/orders/:id/status - Update order status (admin only)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ 
      message: 'Order status updated',
      order 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ========================================
// ADMIN: ACCEPT ORDER
// ========================================
// PATCH /api/orders/:id/accept - Accept a pending order
router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be accepted' });
    }

    order.status = 'accepted';
    await order.save();

    res.json({ 
      message: 'Order accepted',
      order 
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// ========================================
// ADMIN: REJECT/CANCEL ORDER
// ========================================
// PATCH /api/orders/:id/cancel - Cancel an order
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ 
      message: 'Order cancelled',
      order 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
