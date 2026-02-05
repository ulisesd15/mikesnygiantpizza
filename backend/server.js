const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const models = require('./models');  

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

app.get('/', (req, res) => {
  res.json({ message: 'Mike\'s NY Giant Pizza API' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mike\'s NY Giant Pizza API running on port 5001',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-sync', async (req, res) => {
  try {
    console.log('🔄 Syncing database tables...');
    await models.sequelize.sync({ alter: true });
    console.log('✅ Database sync complete');
    res.json({ status: 'success', message: 'Tables synced!' });
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/db-reset', async (req, res) => {
  try {
    console.log('⚠️  WARNING: Dropping and recreating all tables...');
    await models.sequelize.sync({ force: true });
    console.log('✅ Database reset and synced!');
    res.json({ status: 'success', message: 'DB reset and synced!' });
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  
  try {
    await models.sequelize.authenticate();
    console.log('✅ MySQL connected');
    
    await models.sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    // Call associate methods
    Object.values(models).forEach(model => {
      model.associate?.(models);
    });
    console.log('✅ Associations loaded');
    
  } catch (err) {
    console.error('❌ Database sync failed:', err.message);
    console.error('\n⚠️  Troubleshooting:');
    console.error('   1. Check MySQL is running: mysql -u root -p');
    console.error('   2. Create DB if missing: CREATE DATABASE mikes_pizza;');
    console.error('   3. Visit http://laocalhost:5001/api/db-sync');
  }
});
