const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { Ingredient } = require('../models');
const { Op } = require('sequelize');

// Protect ALL inventory routes - admin only
router.use(auth);
router.use(adminAuth);

// =====================================================
// GET ALL INGREDIENTS
// =====================================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, lowStock } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Search by name
    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }
    
    // Filter low stock items
    if (lowStock === 'true') {
      whereClause[Op.or] = [
        { currentStock: { [Op.lte]: sequelize.col('reorderLevel') } },
        { currentStock: 0 }
      ];
    }

    const { count, rows: ingredients } = await Ingredient.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate low stock count
    const lowStockCount = await Ingredient.count({
      where: {
        [Op.or]: [
          { currentStock: { [Op.lte]: sequelize.col('reorderLevel') } },
          { currentStock: 0 }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        ingredients,
        lowStockCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ingredients' 
    });
  }
});

// =====================================================
// GET LOW STOCK ALERTS
// =====================================================
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Ingredient.findAll({
      where: {
        [Op.or]: [
          { currentStock: { [Op.lte]: sequelize.col('reorderLevel') } },
          { currentStock: 0 }
        ]
      },
      order: [['currentStock', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: lowStockItems.length,
        items: lowStockItems
      }
    });

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch low stock items' 
    });
  }
});

// =====================================================
// GET SINGLE INGREDIENT
// =====================================================
router.get('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);
    
    if (!ingredient) {
      return res.status(404).json({ 
        success: false,
        error: 'Ingredient not found' 
      });
    }

    res.json({
      success: true,
      data: ingredient
    });

  } catch (error) {
    console.error('Error fetching ingredient:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ingredient' 
    });
  }
});

// =====================================================
// CREATE NEW INGREDIENT
// =====================================================
router.post('/', async (req, res) => {
  try {
    const { name, currentStock, reorderLevel, unit, unitCost, supplier } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Ingredient name is required' 
      });
    }

    // Check for duplicate
    const existing = await Ingredient.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: 'Ingredient with this name already exists' 
      });
    }

    const ingredient = await Ingredient.create({
      name,
      currentStock: currentStock || 0,
      reorderLevel: reorderLevel || 10,
      unit: unit || 'pieces',
      unitCost: unitCost || 0,
      supplier: supplier || null
    });

    res.status(201).json({
      success: true,
      message: 'Ingredient created successfully',
      data: ingredient
    });

  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create ingredient' 
    });
  }
});

// =====================================================
// UPDATE INGREDIENT
// =====================================================
router.put('/:id', async (req, res) => {
  try {
    const { name, currentStock, reorderLevel, unit, unitCost, supplier } = req.body;
    const ingredient = await Ingredient.findByPk(req.params.id);
    
    if (!ingredient) {
      return res.status(404).json({ 
        success: false,
        error: 'Ingredient not found' 
      });
    }

    // Update fields
    if (name !== undefined) ingredient.name = name;
    if (currentStock !== undefined) ingredient.currentStock = currentStock;
    if (reorderLevel !== undefined) ingredient.reorderLevel = reorderLevel;
    if (unit !== undefined) ingredient.unit = unit;
    if (unitCost !== undefined) ingredient.unitCost = unitCost;
    if (supplier !== undefined) ingredient.supplier = supplier;

    await ingredient.save();

    res.json({
      success: true,
      message: 'Ingredient updated successfully',
      data: ingredient
    });

  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update ingredient' 
    });
  }
});

// =====================================================
// ADJUST STOCK (Quick +/- operations)
// =====================================================
router.patch('/:id/adjust', async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const ingredient = await Ingredient.findByPk(req.params.id);
    
    if (!ingredient) {
      return res.status(404).json({ 
        success: false,
        error: 'Ingredient not found' 
      });
    }

    if (adjustment === undefined || isNaN(adjustment)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid adjustment amount is required' 
      });
    }

    const newStock = ingredient.currentStock + parseInt(adjustment);
    
    if (newStock < 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Stock cannot be negative' 
      });
    }

    ingredient.currentStock = newStock;
    await ingredient.save();

    // TODO: Log adjustment in inventory history table (future enhancement)
    console.log(`Stock adjusted: ${ingredient.name} ${adjustment > 0 ? '+' : ''}${adjustment} (${reason || 'No reason'})`);

    res.json({
      success: true,
      message: `Stock adjusted by ${adjustment}`,
      data: ingredient
    });

  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to adjust stock' 
    });
  }
});

// =====================================================
// DELETE INGREDIENT
// =====================================================
router.delete('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);
    
    if (!ingredient) {
      return res.status(404).json({ 
        success: false,
        error: 'Ingredient not found' 
      });
    }

    await ingredient.destroy();

    res.json({
      success: true,
      message: 'Ingredient deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete ingredient' 
    });
  }
});

module.exports = router;