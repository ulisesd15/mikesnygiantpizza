const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('./models');

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());

// ADD THESE 3 LINES HERE 👇
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
const authRoutes = require('./routes/auth');
console.log('authRoutes:', typeof authRoutes, authRoutes);

const menuRoutes = require('./routes/menu');
console.log('menuRoutes:', typeof menuRoutes, menuRoutes);

const adminRoutes = require('./routes/admin');
console.log('adminRoutes:', typeof adminRoutes, adminRoutes);

const orderRoutes = require('./routes/orders');
console.log('orderRoutes:', typeof orderRoutes, orderRoutes);

// In backend/server.js, add:
const analyticsRoutes = require('./routes/analytics');
console.log('analyticsRoutes:', typeof analyticsRoutes, analyticsRoutes);



app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/analytics', require('./routes/analytics'));

// Your existing routes 👇
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

// ✅ IMPROVED: Sync tables safely without force delete
app.get('/api/db-sync', async (req, res) => {
  try {
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({ alter: true }); // Safely updates tables
    console.log('✅ Database sync complete');
    res.json({ status: 'success', message: 'Tables synced!' });
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ⚠️ WARNING: Reset DB (development only) - Drops all tables!
app.get('/api/db-reset', async (req, res) => {
  try {
    console.log('⚠️  WARNING: Dropping and recreating all tables...');
    await sequelize.sync({ force: true }); // WARNING: Drops tables!
    console.log('✅ Database reset and synced!');
    res.json({ status: 'success', message: 'DB reset and synced!' });
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {

  try {
    // ✅ IMPROVED: Safe sync on startup

    await sequelize.sync({ alter: true }); // Safe: updates tables without data loss

  } catch (err) {
    console.error('❌ Database sync failed:', err.message);
    console.error('\n⚠️  Troubleshooting:');
    console.error('   1. Check MySQL is running: mysql -u root -p');
    console.error('   2. If constraint error, reset DB:');
    console.error('      - DROP DATABASE IF EXISTS mikes_pizza;');
    console.error('      - CREATE DATABASE mikes_pizza;');
    console.error('      - npm start');
  }
});





