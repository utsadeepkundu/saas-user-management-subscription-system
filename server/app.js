import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import featureRoutes from './routes/features.js';

const app = express();
app.disable('x-powered-by');
// Vercel sits behind a trusted proxy; this is also required for correct rate-limit IP handling.
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
].filter(Boolean);

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

// The cors package's delegate receives the Express request as its first argument.
// Allow configured frontend origins, same-origin requests, and non-browser clients.
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, { ...corsOptions, origin: true });
  }
  try {
    if (new URL(origin).host === req.headers.host) {
      return callback(null, { ...corsOptions, origin: true });
    }
  } catch { /* invalid origins fall through to denial */ }
  const error = new Error('Origin is not allowed by CORS.');
  error.status = 403;
  return callback(error);
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/features', featureRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.status === 403 && String(err.message).includes('CORS')) {
    return res.status(403).json({ success: false, message: 'This origin is not allowed.' });
  }
  console.error('Unhandled API error:', err?.message || err);
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error.' : (err.message || 'Request failed.'),
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { details: err.message } : {}),
  });
});

export default app;
