//routes/order.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, MenuItem, sequelize } = require('../models');
const { authenticate, optionalAuth, adminAuth } = require('../middleware/auth');

router.post('/', optionalAuth, async (req, res) => {
  let transaction;

  const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));
  const toRadians = (value) => (Number(value) * Math.PI) / 180;

  const calculateDistanceMiles = (lat1, lng1, lat2, lng2) => {
    const earthRadiusMiles = 3958.8;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  };

  const getDeliveryFee = (distanceMiles) => {
    if (!distanceMiles || distanceMiles <= 0) return 0;
    if (distanceMiles <= 2) return 2.99;
    if (distanceMiles <= 4) return 4.99;
    if (distanceMiles <= 6) return 6.99;
    if (distanceMiles <= 8) return 8.99;
    return 10.99;
  };

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
      estimatedTime,
      deliveryLat,
      deliveryLng
    } = req.body;

    const TAX_RATE = Number(process.env.SALES_TAX_RATE || 0.0825);
    const SHOP_LAT = Number(process.env.SHOP_LAT || 34.0522);
    const SHOP_LNG = Number(process.env.SHOP_LNG || -118.2437);

    if (!customerName || !customerEmail || !customerPhone) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Customer name, email, and phone are required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
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

    const menuItemIds = items
      .map((item) => item.menuItemId)
      .filter(Boolean);

    const menuItems = await MenuItem.findAll({
      where: { id: menuItemIds },
      transaction
    });

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    let computedSubtotal = 0;

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);

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

      const quantity = parseInt(item.quantity || 1, 10);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid quantity for ${menuItem.name}`
        });
      }

      const unitPrice = Number(menuItem.price || 0);
      computedSubtotal += unitPrice * quantity;
    }

    computedSubtotal = roundMoney(computedSubtotal);

    let distanceMiles = 0;

    if (
      orderType === 'delivery' &&
      Number.isFinite(Number(deliveryLat)) &&
      Number.isFinite(Number(deliveryLng))
    ) {
      distanceMiles = calculateDistanceMiles(
        SHOP_LAT,
        SHOP_LNG,
        Number(deliveryLat),
        Number(deliveryLng)
      );
    }

    distanceMiles = roundMoney(distanceMiles);

    const computedDeliveryFee =
      orderType === 'delivery'
        ? roundMoney(getDeliveryFee(distanceMiles))
        : 0;

    const isAdminOrder = req.user?.role === 'admin';
    const computedTax = isAdminOrder ? 0 : roundMoney(computedSubtotal * TAX_RATE);
    const computedTotalPrice = roundMoney(
      computedSubtotal + computedTax + computedDeliveryFee
    );

    const safeEstimatedTime = Number.isInteger(parseInt(estimatedTime, 10))
      ? parseInt(estimatedTime, 10)
      : 35;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const orderData = {
      orderNumber,
      userId: req.user ? req.user.id : null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress?.trim() || null : null,
      deliveryInstructions: orderType === 'delivery' ? deliveryInstructions?.trim() || null : null,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      status: 'pending',
      subtotal: computedSubtotal,
      tax: computedTax,
      deliveryFee: computedDeliveryFee,
      totalPrice: computedTotalPrice,
      estimatedTime: safeEstimatedTime
    };

    console.log('📦 Final computed orderData:', {
      ...orderData,
      distanceMiles,
      isAdminOrder
    });

    const order = await Order.create(orderData, { transaction });

    const orderItems = items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId);

      return {
        orderId: order.id,
        menuItemId: item.menuItemId,
        name: menuItem?.name || item.name,
        size: item.size || menuItem?.size || null,
        price: roundMoney(menuItem?.price || 0),
        quantity: parseInt(item.quantity || 1, 10),
        specialInstructions: item.specialInstructions || null,
        addedToppings: Array.isArray(item.addedToppings) ? item.addedToppings : [],
        removedToppings: Array.isArray(item.removedToppings) ? item.removedToppings : []
      };
    });

    await OrderItem.bulkCreate(orderItems, { transaction });
    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem'
            }
          ]
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!createdOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order created but could not be reloaded'
      });
    }

    const createdOrderJson = createdOrder.toJSON();

    console.log('✅ Order created:', createdOrderJson.orderNumber || createdOrderJson.id);
    console.log('✅ Returned order pricing:', {
      subtotal: createdOrderJson.subtotal,
      tax: createdOrderJson.tax,
      deliveryFee: createdOrderJson.deliveryFee,
      totalPrice: createdOrderJson.totalPrice,
      orderType: createdOrderJson.orderType
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        ...createdOrderJson,
        subtotal: roundMoney(createdOrderJson.subtotal ?? computedSubtotal),
        tax: roundMoney(createdOrderJson.tax ?? computedTax),
        deliveryFee: roundMoney(createdOrderJson.deliveryFee ?? computedDeliveryFee),
        total: roundMoney(createdOrderJson.totalPrice ?? computedTotalPrice),
        totalPrice: roundMoney(createdOrderJson.totalPrice ?? computedTotalPrice),
        distanceMiles,
        isTaxExempt: isAdminOrder
      }
    });
  } catch (error) {
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

router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: MenuItem, as: 'menuItem' }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
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
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

router.get('/user', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'orderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
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

router.get('/admin/all', authenticate, adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const whereClause = status ? { status } : {};

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'orderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
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

router.get('/admin/pending', authenticate, adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
        }
      ],
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

router.get('/customer/:userId', authenticate, adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.params.userId },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: MenuItem, as: 'menuItem' }]
        }
      ],
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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems'
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

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

router.patch('/:id/status', authenticate, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = String(status || '').toLowerCase();
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(normalizedStatus)) {
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

    order.status = normalizedStatus;
    await order.save();

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

router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

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

router.get('/', authenticate, async (req, res) => {
  req.url = '/my-orders';
  return router.handle(req, res);
});

module.exports = router;