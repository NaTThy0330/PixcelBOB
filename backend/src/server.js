const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const lineRoutes = require('./routes/lineRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadQueueWorker = require('./workers/uploadQueueWorker');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection check
console.log('Environment:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Using database config:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'Individual DB vars');

app.use(helmet());
// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://pixcelbob.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173' // Vite default port
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-line-signature'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
}));

app.use('/auth', authRoutes);
app.use('/line', lineRoutes);
app.use('/user', userRoutes);
app.use('/stats', statsRoutes);

app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    database: 'checking...'
  };

  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.error = error.message;
  }

  res.json(health);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Make sure DATABASE_URL is set in Render environment variables');
  }
  
  // Start upload queue worker
  uploadQueueWorker.start(30000); // Process queue every 30 seconds
  console.log('Upload queue worker started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  uploadQueueWorker.stop();
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  uploadQueueWorker.stop();
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});