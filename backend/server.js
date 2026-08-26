// server.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const { sequelize } = require('./backend/models');
const apiRoutes = require('./backend/routes/apiRoutes');
const authRoutes = require('./backend/routes/authRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// --- Security ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' is only required because of inline onclick=""
      // handlers in main.jsx — remove once you migrate to real React
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://accounts.google.com'],
      frameSrc: ["'self'", 'https://accounts.google.com'],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: isProduction
    ? (process.env.TRUSTED_ORIGINS?.split(',') ?? [])
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// --- Rate limits ---
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// --- Serve the built SPA (production only) ---
if (isProduction) {
  const dist = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) =>
    res.sendFile(path.join(dist, 'index.html'))
  );
}

// --- 404 (API only) ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// --- Errors ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json(
    isProduction
      ? { error: 'Something went wrong!' }
      : { error: err.message, stack: err.stack }
  );
});

// --- Boot ---
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
  } catch (e) {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  const shutdown = (sig) => {
    console.log(`${sig} received, shutting down gracefully`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();