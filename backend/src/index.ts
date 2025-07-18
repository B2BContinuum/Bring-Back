import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Import API routes
import { apiRoutes } from './routes';

// API routes
app.use('/api', apiRoutes);

// Initialize server with database connection check
async function startServer() {
  try {
    console.log('🔍 Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - server starting in degraded mode');
      console.warn('   Please check your database configuration and run migrations');
    } else {
      console.log('✅ Database connection successful');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Bring-Back API server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;