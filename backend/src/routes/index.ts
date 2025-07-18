import express from 'express';
import locationRoutes from './locations';
import tripRoutes from './trips';
import requestRoutes from './requests';
import webhookRoutes from './webhooks';
import userRoutes from './users';
import messageRoutes from './messages';
import statusRoutes from './status';
import { createNotificationRouter } from './notifications';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { MessageController } from '../controllers/MessageController';
import { MessageService } from '../services/MessageService';
import { MessageRepository } from '../repositories/MessageRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { DeviceTokenRepository } from '../repositories/DeviceTokenRepository';
import { TripRepository } from '../repositories/TripRepository';
import { RequestRepository } from '../repositories/RequestRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { StatusTrackingController } from '../controllers/StatusTrackingController';
import { StatusTrackingService } from '../services/StatusTrackingService';
import { StatusTrackingRepository } from '../repositories/StatusTrackingRepository';

// Load environment variables
dotenv.config();

const router = express.Router();

// Get database pool from app context
const getPool = (): Pool => {
  return (global as any).dbPool;
};

// Get WebSocket manager from app context
const getWebSocketManager = () => {
  return (global as any).webSocketManager;
};

// Create repositories
const createMessageRepository = () => new MessageRepository(getPool());
const createUserRepository = () => new UserRepository(getPool());
const createNotificationRepository = () => new NotificationRepository(getPool());
const createDeviceTokenRepository = () => new DeviceTokenRepository(getPool());
const createTripRepository = () => new TripRepository(getPool());
const createRequestRepository = () => new RequestRepository(getPool());
const createPaymentRepository = () => new PaymentRepository(getPool());
const createStatusTrackingRepository = () => new StatusTrackingRepository(getPool());

// Create notification service
const createNotificationService = () => new NotificationService(
  createDeviceTokenRepository(),
  createNotificationRepository(),
  createTripRepository(),
  createRequestRepository(),
  createUserRepository(),
  createPaymentRepository(),
  process.env.FCM_API_KEY || ''
);

// Create message service
const createMessageService = () => new MessageService(
  createMessageRepository(),
  createUserRepository(),
  createNotificationService(),
  getWebSocketManager()
);

// Create status tracking service
const createStatusTrackingService = () => new StatusTrackingService(
  createTripRepository(),
  createRequestRepository(),
  createNotificationService(),
  getWebSocketManager()
);

// Create message controller
const createMessageController = () => new MessageController(createMessageService());

// Create status tracking controller
const createStatusTrackingController = () => new StatusTrackingController(createStatusTrackingService());

// API routes
router.use('/locations', locationRoutes);
router.use('/trips', tripRoutes);
router.use('/requests', requestRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes(createMessageController()));
router.use('/notifications', createNotificationRouter(
  getPool(),
  process.env.FCM_API_KEY || ''
));
router.use('/status', statusRoutes(createStatusTrackingController()));

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;