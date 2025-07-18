import express from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationService } from '../services/NotificationService';
import { DeviceTokenRepository } from '../repositories/DeviceTokenRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { TripRepository } from '../repositories/TripRepository';
import { RequestRepository } from '../repositories/RequestRepository';
import { UserRepository } from '../repositories/UserRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { Pool } from 'pg';

export function createNotificationRouter(
  pool: Pool,
  fcmApiKey: string
): express.Router {
  const router = express.Router();

  // Initialize repositories
  const deviceTokenRepository = new DeviceTokenRepository(pool);
  const notificationRepository = new NotificationRepository(pool);
  const tripRepository = new TripRepository(pool);
  const requestRepository = new RequestRepository(pool);
  const userRepository = new UserRepository(pool);
  const paymentRepository = new PaymentRepository(pool);

  // Initialize service
  const notificationService = new NotificationService(
    deviceTokenRepository,
    notificationRepository,
    tripRepository,
    requestRepository,
    userRepository,
    paymentRepository,
    fcmApiKey
  );

  // Initialize controller
  const notificationController = new NotificationController(notificationService);

  // Define routes
  router.post('/device-tokens/register', (req, res) => notificationController.registerDeviceToken(req, res));
  router.post('/device-tokens/unregister', (req, res) => notificationController.unregisterDeviceToken(req, res));
  router.get('/users/:userId', (req, res) => notificationController.getUserNotifications(req, res));
  router.put('/:notificationId/read', (req, res) => notificationController.markNotificationAsRead(req, res));
  router.put('/users/:userId/read-all', (req, res) => notificationController.markAllNotificationsAsRead(req, res));

  return router;
}