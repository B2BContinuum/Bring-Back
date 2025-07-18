import { Request, Response } from 'express';
import { INotificationService } from '../services/NotificationService';

export class NotificationController {
  private notificationService: INotificationService;

  constructor(notificationService: INotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId, deviceToken, deviceType } = req.body;

      if (!userId || !deviceToken || !deviceType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const result = await this.notificationService.registerDeviceToken(userId, deviceToken, deviceType);
      
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to register device token' });
      }
    } catch (error) {
      console.error('Error registering device token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId, deviceToken } = req.body;

      if (!userId || !deviceToken) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const result = await this.notificationService.unregisterDeviceToken(userId, deviceToken);
      
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Device token not found' });
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const notifications = await this.notificationService.getUserNotifications(userId, limit, offset);
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({ error: 'Notification ID is required' });
        return;
      }

      const result = await this.notificationService.markNotificationAsRead(notificationId);
      
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const count = await this.notificationService.markAllNotificationsAsRead(userId);
      res.status(200).json({ success: true, count });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}