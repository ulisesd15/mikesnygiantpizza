//routes/menu.js
const express = require('express');
const models = require('../models');
const { authenticate, adminAuth } = require('../middleware/auth');

const MenuItem = models.MenuItem;
const router = express.Router();

// GET all menu items (public)
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      where: { isAvailable: true }
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET customization for one menu item
// Must come BEFORE '/:id'
router.get('/:id(\\d+)/customization', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid menu item id' });
    }

    const menuItem = await MenuItem.findByPk(id);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const size = menuItem.size;

    const defaultRows = await MenuItemDefaultTopping.findAll({
      where: { menuItemId: id },
      include: [
        {
          model: Ingredient,
          as: 'ingredient',
          required: false
        }
      ]
    });

    const mandatory = defaultRows
      .filter((row) => row.ingredient)
      .map((row) => ({
        id: row.ingredient.id,
        name: row.ingredient.name,
        isRemovable: true
      }));

    const toppingPriceRows = await PizzaToppingPrice.findAll({
      where: { size },
      include: [
        {
          model: Ingredient,
          as: 'ingredient',
          required: false
        }
      ]
    });

    const validToppingPriceRows = toppingPriceRows.filter((row) => row.ingredient);

    const mandatoryIds = new Set(mandatory.map((item) => item.id));

    const optional = validToppingPriceRows
      .filter((row) => !mandatoryIds.has(row.ingredient.id))
      .map((row) => ({
        id: row.ingredient.id,
        name: row.ingredient.name,
        price: parseFloat(row.price || 0)
      }));

    const itemPrices = Object.fromEntries(
      validToppingPriceRows.map((row) => [
        row.ingredient.id,
        parseFloat(row.price || 0)
      ])
    );

    return res.json({
      data: {
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          size,
          basePrice: parseFloat(menuItem.price || 0)
        },
        mandatory,
        optional,
        itemPrices
      }
    });
  } catch (error) {
    console.error('Error fetching customization data:', error);
    return res.status(500).json({
      error: 'Failed to fetch customization data',
      details: error.message
    });
  }
});

// GET single item
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
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

// PATCH single item (admin only)
router.patch('/:id(\\d+)', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update(req.body);

    res.json({
      message: 'Updated',
      item
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE (admin only)
router.put('/:id(\\d+)', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE (admin only)
router.delete('/:id(\\d+)', authenticate, adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;