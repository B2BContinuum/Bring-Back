import express from 'express';
import { StatusTrackingController } from '../controllers/StatusTrackingController';
import { authenticateJWT } from '../middleware/auth';

export default function statusRoutes(statusTrackingController: StatusTrackingController) {
  const router = express.Router();
  
  // Apply authentication middleware to all routes
  router.use(authenticateJWT);
  
  // Trip status routes
  router.put('/trips/:tripId/status', 
    (req, res) => statusTrackingController.updateTripStatus(req, res));
  
  // Request status routes
  router.put('/requests/:requestId/status', 
    (req, res) => statusTrackingController.updateRequestStatus(req, res));
  
  // Photo confirmation routes
  router.post('/photo-confirmation', 
    (req, res) => statusTrackingController.addPhotoConfirmation(req, res));
  
  // Receipt confirmation routes
  router.post('/receipt-confirmation', 
    (req, res) => statusTrackingController.addReceiptConfirmation(req, res));
  
  // Status history routes
  router.get('/:entityType/:entityId/history', 
    (req, res) => statusTrackingController.getStatusHistory(req, res));
  
  // Latest status routes
  router.get('/:entityType/:entityId/latest', 
    (req, res) => statusTrackingController.getLatestStatus(req, res));
  
  return router;
}