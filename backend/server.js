// ============================================
// server.js — ProjectFlow Backend Entry Point
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimiter');

// Routes
const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const chatRoutes = require('./src/routes/chat');
const memberRoutes = require('./src/routes/members');
const analyticsRoutes = require('./src/routes/analytics');

// Connect DB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// ============================================
// ✅ CORS FIX (IMPORTANT)
// ============================================

const allowedOrigins = [
  "http://localhost:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow localhost
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // Allow ALL Vercel deployments
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ============================================
// Socket.io
// ============================================

const io = new Server(httpServer, {
  cors: {
    origin: "*", // socket is fine with wildcard
    methods: ["GET", "POST"],
  },
});

app.set('io', io);
initSocket(io);

// ============================================
// Middleware
// ============================================

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/auth', rateLimiter.authLimiter);
app.use('/api', rateLimiter.apiLimiter);

// ============================================
// Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============================================
// Health check
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ============================================
// 404 Handler
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// Error handler
// ============================================

app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 ProjectFlow Server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API:  http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

// ============================================
// Handle crashes
// ============================================

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  httpServer.close(() => process.exit(1));
});