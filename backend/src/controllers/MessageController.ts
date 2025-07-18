import { Request, Response } from 'express';
import { IMessageService } from '../services/MessageService';
import { MessageCreateParams } from '../models/Message';

export interface IMessageController {
  sendMessage(req: Request, res: Response): Promise<void>;
  getConversation(req: Request, res: Response): Promise<void>;
  getUserConversations(req: Request, res: Response): Promise<void>;
  markMessageAsRead(req: Request, res: Response): Promise<void>;
  markConversationAsRead(req: Request, res: Response): Promise<void>;
  getUnreadMessageCount(req: Request, res: Response): Promise<void>;
}

export class MessageController implements IMessageController {
  private messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { recipientId, content, relatedRequestId, relatedTripId } = req.body;

      if (!recipientId || !content) {
        res.status(400).json({ error: 'Recipient ID and content are required' });
        return;
      }

      const messageParams: MessageCreateParams = {
        sender_id: userId,
        recipient_id: recipientId,
        content,
        related_request_id: relatedRequestId,
        related_trip_id: relatedTripId
      };

      const message = await this.messageService.sendMessage(messageParams);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const otherUserId = req.params.userId;
      if (!otherUserId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const messages = await this.messageService.getConversation(userId, otherUserId, limit, offset);
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  }

  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const conversations = await this.messageService.getUserConversations(userId, limit, offset);
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const messageId = req.params.messageId;
      if (!messageId) {
        res.status(400).json({ error: 'Message ID is required' });
        return;
      }

      const success = await this.messageService.markMessageAsRead(messageId, userId);
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Message not found or already read' });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }

  async markConversationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const otherUserId = req.params.userId;
      if (!otherUserId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const count = await this.messageService.markConversationAsRead(userId, otherUserId);
      res.status(200).json({ success: true, count });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
  }

  async getUnreadMessageCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await this.messageService.getUnreadMessageCount(userId);
      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting unread message count:', error);
      res.status(500).json({ error: 'Failed to get unread message count' });
    }
  }
}