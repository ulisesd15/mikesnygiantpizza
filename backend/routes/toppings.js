// backend/routes/toppings.js
const express = require('express');
const router = express.Router();
const { Ingredient, PizzaToppingPrice } = require('../models');

router.get('/', async (req, res) => {
  try {
    const toppings = await Ingredient.findAll({
      include: [{
        model: PizzaToppingPrice,
        as: 'toppingPrices'
      }],
      order: [['name', 'ASC']]
    });

    const result = toppings.map(t => {
      const prices = {};
      (t.toppingPrices || []).forEach(p => {
        prices[p.size] = parseFloat(p.price);
      });
      return {
        id: t.id,
        name: t.name,
        prices
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching toppings:', err);
    res.status(500).json({ error: 'Failed to fetch toppings' });
  }
});

module.exports = router;
