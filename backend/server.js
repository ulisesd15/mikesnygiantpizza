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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));


// Health
app.get('/', (req, res) => {
  res.json({ message: "Mike's NY Giant Pizza API" });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: "Mike's NY Giant Pizza API running",
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await models.sequelize.authenticate();
    await models.sequelize.sync();
    console.log('✅ MySQL connected');

    app.listen(PORT, () => {
      console.log(`🚀 Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
  }
}

startServer();
