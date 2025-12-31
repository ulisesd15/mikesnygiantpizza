const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

// GET all menu items (public)
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.findAll({ where: { isAvailable: true } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Orders
// Add to your API routes file (e.g. server.js)
router.post('/api/orders', async (req, res) => {
  try {
    const order = {
      id: Date.now().toString(), // Simple ID for now
      ...req.body,
      userId: req.user?.id || 'guest', // From JWT if logged in
      createdAt: new Date()
    };
    
    // Save to DB/file/localStorage - example with simple array:
    const orders = JSON.parse(fs.readFileSync('./orders.json', 'utf8')) || [];
    orders.push(order);
    fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/api/orders', async (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync('./orders.json', 'utf8')) || [];
    // Filter by user if logged in, or show last 10 for demo
    const userOrders = req.user ? orders.filter(o => o.userId === req.user.id) : orders.slice(-10);
    res.json(userOrders);
  } catch (error) {
    res.json([]);
  }
});






module.exports = router;
