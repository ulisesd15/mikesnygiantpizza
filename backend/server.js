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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

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

// Sync tables (development only)
app.get('/api/db-sync', async (req, res) => {
  try {
    await sequelize.sync({ alter: true }); // Updates tables safely
    res.json({ status: 'success', message: 'Tables synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset DB (development only) - WARNING: Drops tables!
app.get('/api/db-reset', async (req, res) => {
  try {
    await sequelize.sync({ force: true }); // WARNING: Drops tables!
    res.json({ status: 'success', message: 'DB reset and synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, async () => {
  console.log(`🍕 Backend listening on http://localhost:${PORT}`);
  try {
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('❌ Database sync failed:', err.message);
  }
});

// Test DB connection
// const { sequelize } = require('./models');

// Add this before app.listen()
app.get('/api/db-test', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'success', 
      message: 'Database connected!' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});
