const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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

// Get all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const { MenuItem } = require('./models');
    const items = await MenuItem.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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


// Sync DB + Test
const { sequelize } = require('./models');

app.get('/api/db-sync', async (req, res) => {
  try {
    await sequelize.sync({ force: true }); // WARNING: Drops tables!
    res.json({ status: 'success', message: 'DB synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🍕 Backend listening on http://localhost:${PORT}`);
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
