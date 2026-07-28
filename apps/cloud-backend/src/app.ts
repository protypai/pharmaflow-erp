// PharmaFlow Cloud Backend App Entrypoint - Pipeline Trigger
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import adminRoutes from './routes/admin.routes';
import productRoutes from './routes/product.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import purchaseRoutes from './routes/purchase.routes';
import salesRoutes from './routes/sales.routes';
import accountRoutes from './routes/account.routes';
import reportRoutes from './routes/report.routes';
import returnRoutes from './routes/return.routes';
import stockAdjustmentRoutes from './routes/stockAdjustment.routes';
import { db } from './config/database';

const app = express();
app.locals.db = db;

// Security
app.use(helmet());
const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'app://.'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow if origin is explicitly allowed or if allowedOrigins contains a wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'PharmaFlow API running', timestamp: new Date().toISOString() });
});

// Mounted REST API Routes (supports /api and /api/v1)
['/api', '/api/v1'].forEach(prefix => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/sync`, syncRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/customers`, customerRoutes);
  app.use(`${prefix}/suppliers`, supplierRoutes);
  app.use(`${prefix}/purchases`, purchaseRoutes);
  app.use(`${prefix}/sales`, salesRoutes);
  app.use(`${prefix}/accounts`, accountRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/returns`, returnRoutes);
  app.use(`${prefix}/stock-adjustments`, stockAdjustmentRoutes);
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
