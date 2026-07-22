import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
