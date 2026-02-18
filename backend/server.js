const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const models = require('./models');  

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const toppingsRoutes = require('./routes/toppings');
const analyticsRoutes = require('./routes/analytics');
const inventoryRoutes = require('./routes/inventory');

app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/toppings', toppingsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Mike\'s NY Giant Pizza API' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mike\'s NY Giant Pizza API running',
    timestamp: new Date().toISOString()
  });
});

// Explicit DB sync endpoints
app.get('/api/db-sync', async (req, res) => {
  try {
    await models.sequelize.sync({ alter: true });
    res.json({ status: 'success', message: 'Tables synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/db-reset', async (req, res) => {
  try {
    await models.sequelize.sync({ force: true });
    res.json({ status: 'success', message: 'DB reset and synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend listening on port ${PORT}`);

  try {
    await models.sequelize.authenticate();

    // Define associations FIRST (safe, deduped)
    const loaded = new Set();
    Object.keys(models).forEach((modelName) => {
      const model = models[modelName];
      if (typeof model?.associate === 'function') {
        if (loaded.has(modelName)) {
          console.warn(`⚠️ associate() skipped duplicate for model: ${modelName}`);
          return;
        }
        loaded.add(modelName);
        model.associate(models);
      }
    });

    // Then sync (plain sync, no alter on startup)
    await models.sequelize.sync();

  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    console.error('\n⚠️  Troubleshooting:');
    console.error('   1. Check MySQL: mysql -u root -p');
    console.error('   2. CREATE DATABASE mikes_pizza;');
    console.error('   3. http://localhost:5001/api/db-sync');
  }
});
