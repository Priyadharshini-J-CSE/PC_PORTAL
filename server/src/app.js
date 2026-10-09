require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const { startLeetCodeJob } = require('./jobs/leetcodeJob');

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow configured client origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error('[server] FATAL: SESSION_SECRET is not set in .env');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/leetcode', require('./routes/leetcode'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/lingua', require('./routes/lingua'));
app.use('/api/analytics', require('./routes/analytics'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler — never leak stack traces in production
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('[server] FATAL: MONGODB_URI is not set in server/.env');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Running on port ${PORT}`));
    if (process.env.NODE_ENV !== 'test') startLeetCodeJob();
  })
  .catch((err) => {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  });

module.exports = app;
