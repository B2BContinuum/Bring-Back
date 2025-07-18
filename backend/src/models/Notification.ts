import { NotificationType } from '../services/NotificationService';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title_template: string;
  body_template: string;
  created_at: Date;
  updated_at: Date;
}