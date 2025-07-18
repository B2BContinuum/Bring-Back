import { Request, Response } from 'express';
import { IStatusTrackingService } from '../services/StatusTrackingService';
import { TripStatus, RequestStatus } from '../../../shared/src/types';
import { validateRequestBody } from '../utils/validation';
import { z } from 'zod';

export class StatusTrackingController {
  private statusTrackingService: IStatusTrackingService;

  constructor(statusTrackingService: IStatusTrackingService) {
    this.statusTrackingService = statusTrackingService;
  }

  /**
   * Update trip status
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateTripStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      
      // Validate request body
      const schema = z.object({
        status: z.enum([
          TripStatus.ANNOUNCED,
          TripStatus.TRAVELING,
          TripStatus.AT_DESTINATION,
          TripStatus.RETURNING,
          TripStatus.COMPLETED,
          TripStatus.CANCELLED
        ]),
        metadata: z.record(z.any()).optional(),
        notifyUsers: z.boolean().optional(),
        sendRealTimeUpdates: z.boolean().optional()
      });
      
      const validation = validateRequestBody(schema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.errors });
        return;
      }
      
      const { status, metadata, notifyUsers, sendRealTimeUpdates } = req.body;
      
      const options = {
        notifyUsers: notifyUsers !== false, // Default to true
        sendRealTimeUpdates: sendRealTimeUpdates !== false // Default to true
      };
      
      const statusUpdate = await this.statusTrackingService.updateTripStatus(
        tripId,
        status,
        options,
        metadata
      );
      
      res.status(200).json(statusUpdate);
    } catch (error) {
      console.error('Error updating trip status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Update request status
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      
      // Validate request body
      const schema = z.object({
        status: z.enum([
          RequestStatus.PENDING,
          RequestStatus.ACCEPTED,
          RequestStatus.PURCHASED,
          RequestStatus.DELIVERED,
          RequestStatus.CANCELLED
        ]),
        metadata: z.record(z.any()).optional(),
        notifyUsers: z.boolean().optional(),
        sendRealTimeUpdates: z.boolean().optional()
      });
      
      const validation = validateRequestBody(schema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.errors });
        return;
      }
      
      const { status, metadata, notifyUsers, sendRealTimeUpdates } = req.body;
      
      const options = {
        notifyUsers: notifyUsers !== false, // Default to true
        sendRealTimeUpdates: sendRealTimeUpdates !== false // Default to true
      };
      
      const statusUpdate = await this.statusTrackingService.updateRequestStatus(
        requestId,
        status,
        options,
        metadata
      );
      
      res.status(200).json(statusUpdate);
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Add photo confirmation
   * Requirements: 5.4 - Photo confirmation and receipt sharing
   */
  async addPhotoConfirmation(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const schema = z.object({
        entityType: z.enum(['trip', 'request']),
        entityId: z.string().min(1),
        photoUrl: z.string().url(),
        metadata: z.record(z.any()).optional()
      });
      
      const validation = validateRequestBody(schema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.errors });
        return;
      }
      
      const { entityType, entityId, photoUrl, metadata } = req.body;
      
      const statusUpdate = await this.statusTrackingService.addPhotoConfirmation(
        entityType,
        entityId,
        photoUrl,
        metadata
      );
      
      res.status(200).json(statusUpdate);
    } catch (error) {
      console.error('Error adding photo confirmation:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Add receipt confirmation
   * Requirements: 5.4 - Photo confirmation and receipt sharing
   */
  async addReceiptConfirmation(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const schema = z.object({
        entityType: z.enum(['trip', 'request']),
        entityId: z.string().min(1),
        receiptUrl: z.string().url(),
        metadata: z.record(z.any()).optional()
      });
      
      const validation = validateRequestBody(schema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.errors });
        return;
      }
      
      const { entityType, entityId, receiptUrl, metadata } = req.body;
      
      const statusUpdate = await this.statusTrackingService.addReceiptConfirmation(
        entityType,
        entityId,
        receiptUrl,
        metadata
      );
      
      res.status(200).json(statusUpdate);
    } catch (error) {
      console.error('Error adding receipt confirmation:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get status history
   */
  async getStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      if (entityType !== 'trip' && entityType !== 'request') {
        res.status(400).json({ error: 'Invalid entity type. Must be "trip" or "request".' });
        return;
      }
      
      const statusHistory = await this.statusTrackingService.getStatusHistory(
        entityType as 'trip' | 'request',
        entityId,
        limit,
        offset
      );
      
      res.status(200).json(statusHistory);
    } catch (error) {
      console.error('Error getting status history:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get latest status
   */
  async getLatestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      
      if (entityType !== 'trip' && entityType !== 'request') {
        res.status(400).json({ error: 'Invalid entity type. Must be "trip" or "request".' });
        return;
      }
      
      const latestStatus = await this.statusTrackingService.getLatestStatus(
        entityType as 'trip' | 'request',
        entityId
      );
      
      if (!latestStatus) {
        res.status(404).json({ error: 'Status not found' });
        return;
      }
      
      res.status(200).json(latestStatus);
    } catch (error) {
      console.error('Error getting latest status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}