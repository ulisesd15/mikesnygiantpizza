const express = require('express');
const models = require('../models');  // ✅ All models
const MenuItem = models.MenuItem;
const PizzaToppingPrice = models.PizzaToppingPrice;
const Ingredient = models.Ingredient;
const { authenticate, adminAuth } = require('../middleware/auth');  // ✅ Add this

const router = express.Router();




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

// PATCH single item (admin only)
router.patch('/:id', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json({ message: 'Updated', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE (admin only)
router.post('/', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE (admin only)
router.put('/:id', authenticate, adminAuth, async (req, res) => {
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
router.delete('/:id', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/customization', async (req, res) => {
  try {
    // Fix 1: Remove isRemovable from through attributes
    const menuItem = await MenuItem.findByPk(req.params.id, {
      include: [{
        model: Ingredient,
        as: 'defaultToppings',
        through: { attributes: [] }  // ✅ No attributes = no column validation errors
      }]
    });

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const size = menuItem.size;
    
    // Default isRemovable = true since we can't get it from through table yet
    const defaultToppings = (menuItem.defaultToppings || []).map(t => ({
      id: t.id,
      name: t.name,
      isRemovable: true  // ✅ Default value
    }));

    const toppingPrices = await PizzaToppingPrice.findAll({
      where: { size },
      include: [{ model: Ingredient, as: 'ingredient' }]
    });

    const availableToppings = toppingPrices.map(tp => ({
      id: tp.ingredient.id,
      name: tp.ingredient.name,
      price: parseFloat(tp.price)
    }));

    res.json({
      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
        size,
        basePrice: parseFloat(menuItem.price)
      },
      defaultToppings,
      availableToppings
    });
  } catch (err) {
    console.error('Error fetching customization data:', err);
    res.status(500).json({ error: 'Failed to fetch customization data' });
  }
});



module.exports = router;  // ✅ EXPORT THE ROUTER, NOT THE MIDDLEWARE!
