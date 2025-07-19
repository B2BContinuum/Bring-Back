import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Pool } from 'pg';
import apiRoutes from './routes';
import { WebSocketManager } from './utils/WebSocketManager';
import { errorHandler } from './utils/errorHandler';
import { logger, requestLogger } from './utils/logger';
import { metricsMiddleware, healthCheck, startMonitoring } from './utils/monitoring';

// Load environment variables
dotenv.config();

// Setup server
export const setupServer = async (app: express.Application) => {
  // Create database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Make database pool available globally
  (global as any).dbPool = pool;

  // Middleware
  app.use(helmet()); // Security headers
  app.use(cors()); // CORS support
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

  // Add request ID middleware
  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || 
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    next();
  });

  // Add logging and metrics middleware
  app.use(requestLogger);
  app.use(metricsMiddleware);

  // Rate limiting middleware
  const rateLimit = require('express-rate-limit');
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString()
      }
    }
  }));

  // Health check endpoint
  app.get('/health', healthCheck);

  // API routes
  app.use('/api', apiRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket manager
const webSocketManager = new WebSocketManager(
  server,
  process.env.JWT_SECRET || 'default_jwt_secret'
);

// Make WebSocket manager available globally
(global as any).webSocketManager = webSocketManager;

// Initialize server
setupServer(app).then(() => {
  // Start server
  server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`WebSocket server initialized`);
    
    // Start monitoring
    const stopMonitoring = startMonitoring();
    
    // Store stop function for graceful shutdown
    (global as any).stopMonitoring = stopMonitoring;
  });
}).catch(err => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  // Stop monitoring
  if ((global as any).stopMonitoring) {
    (global as any).stopMonitoring();
  }
  
  server.close(() => {
    logger.info('HTTP server closed');
    webSocketManager.shutdown();
    
    // Close database connection
    if ((global as any).dbPool) {
      (global as any).dbPool.end();
    }
    
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({
    message: 'Uncaught exception',
    error: error.message,
    stack: error.stack
  });
  
  // Exit with error
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    message: 'Unhandled promise rejection',
    reason,
    promise
  });
});

export default app;