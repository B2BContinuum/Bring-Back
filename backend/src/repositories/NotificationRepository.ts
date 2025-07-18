import { Pool } from 'pg';
import { Notification, NotificationTemplate } from '../models/Notification';
import { NotificationType } from '../services/NotificationService';

export interface INotificationRepository {
  createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification>;
  getNotificationsByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  getNotificationTemplate(type: NotificationType): Promise<NotificationTemplate | null>;
  getAllNotificationTemplates(): Promise<NotificationTemplate[]>;
}

export class NotificationRepository implements INotificationRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, type, title, body, data, is_read)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, type, title, body, data, is_read, created_at, updated_at
    `;
    
    const result = await this.pool.query(query, [
      notification.user_id,
      notification.type,
      notification.title,
      notification.body,
      notification.data || {},
      notification.is_read || false
    ]);
    
    return result.rows[0];
  }

  async getNotificationsByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const query = `
      SELECT id, user_id, type, title, body, data, is_read, created_at, updated_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [notificationId]);
    return result.rowCount > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = NOW()
      WHERE user_id = $1 AND is_read = FALSE
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rowCount;
  }

  async getNotificationTemplate(type: NotificationType): Promise<NotificationTemplate | null> {
    const query = `
      SELECT id, type, title_template, body_template, created_at, updated_at
      FROM notification_templates
      WHERE type = $1
    `;
    
    const result = await this.pool.query(query, [type]);
    return result.rows[0] || null;
  }

  async getAllNotificationTemplates(): Promise<NotificationTemplate[]> {
    const query = `
      SELECT id, type, title_template, body_template, created_at, updated_at
      FROM notification_templates
      ORDER BY type
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }
}