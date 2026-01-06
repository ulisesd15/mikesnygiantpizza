const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ✅ LOAD MODELS FIRST (before routes need them!)
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware in correct order
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
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ✅ Register API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders')); // 🆕 NEW!

// ✅ Basic routes
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

// ✅ DB test route
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

// ✅ DB sync route (use { alter: true } for safety)
app.get('/api/db-sync', async (req, res) => {
  try {
    await sequelize.sync({ alter: true }); // Safe - won't drop data
    res.json({ status: 'success', message: 'Tables synced!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🍕 Backend listening on http://localhost:${PORT}`);
});
