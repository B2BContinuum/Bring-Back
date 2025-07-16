import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.use('/api', (req, res) => {
  res.json({ message: 'Bring-Back API - Coming Soon' });
});

app.listen(PORT, () => {
  console.log(`🚀 Bring-Back API server running on port ${PORT}`);
});

export default app;