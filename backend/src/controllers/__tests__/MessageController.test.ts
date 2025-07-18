import { Request, Response } from 'express';
import { MessageController } from '../MessageController';
import { IMessageService } from '../../services/MessageService';
import { Message, Conversation } from '../../models/Message';

// Create mock for MessageService
const mockMessageService: jest.Mocked<IMessageService> = {
  sendMessage: jest.fn(),
  getConversation: jest.fn(),
  getUserConversations: jest.fn(),
  markMessageAsRead: jest.fn(),
  markConversationAsRead: jest.fn(),
  getUnreadMessageCount: jest.fn()
};

// Helper to create mock request and response
const createMockReqRes = () => {
  const req = {
    user: { id: 'user-123' },
    params: {},
    query: {},
    body: {}
  } as unknown as Request;
  
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;
  
  return { req, res };
};

describe('MessageController', () => {
  let messageController: MessageController;

  beforeEach(() => {
    jest.clearAllMocks();
    messageController = new MessageController(mockMessageService);
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        recipientId: 'recipient-456',
        content: 'Hello, this is a test message',
        relatedRequestId: 'request-789'
      };

      const mockMessage: Message = {
        id: 'message-123',
        sender_id: 'user-123',
        recipient_id: 'recipient-456',
        content: 'Hello, this is a test message',
        is_read: false,
        related_request_id: 'request-789',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockMessageService.sendMessage.mockResolvedValueOnce(mockMessage);

      await messageController.sendMessage(req, res);

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        sender_id: 'user-123',
        recipient_id: 'recipient-456',
        content: 'Hello, this is a test message',
        related_request_id: 'request-789'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 401 if user is not authenticated', async () => {
      const { req, res } = createMockReqRes();
      req.user = undefined;

      await messageController.sendMessage(req, res);

      expect(mockMessageService.sendMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        // Missing recipientId or content
      };

      await messageController.sendMessage(req, res);

      expect(mockMessageService.sendMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Recipient ID and content are required' });
    });

    it('should return 500 if an error occurs', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        recipientId: 'recipient-456',
        content: 'Hello'
      };

      mockMessageService.sendMessage.mockRejectedValueOnce(new Error('Test error'));

      await messageController.sendMessage(req, res);

      expect(mockMessageService.sendMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send message' });
    });
  });

  describe('getConversation', () => {
    it('should return messages between two users', async () => {
      const { req, res } = createMockReqRes();
      req.params.userId = 'user-456';
      req.query = { limit: '10', offset: '0' };

      const mockMessages: Message[] = [
        {
          id: 'message-1',
          sender_id: 'user-123',
          recipient_id: 'user-456',
          content: 'Hello',
          is_read: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'message-2',
          sender_id: 'user-456',
          recipient_id: 'user-123',
          content: 'Hi there',
          is_read: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockMessageService.getConversation.mockResolvedValueOnce(mockMessages);

      await messageController.getConversation(req, res);

      expect(mockMessageService.getConversation).toHaveBeenCalledWith('user-123', 'user-456', 10, 0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });

    it('should return 401 if user is not authenticated', async () => {
      const { req, res } = createMockReqRes();
      req.user = undefined;
      req.params.userId = 'user-456';

      await messageController.getConversation(req, res);

      expect(mockMessageService.getConversation).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if userId is missing', async () => {
      const { req, res } = createMockReqRes();
      req.params = {}; // Missing userId

      await messageController.getConversation(req, res);

      expect(mockMessageService.getConversation).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User ID is required' });
    });
  });

  describe('getUserConversations', () => {
    it('should return all conversations for a user', async () => {
      const { req, res } = createMockReqRes();
      req.query = { limit: '20', offset: '0' };

      const mockConversations: any[] = [
        {
          id: 'message-1',
          sender_id: 'user-123',
          recipient_id: 'user-456',
          content: 'Hello',
          is_read: true,
          created_at: new Date(),
          conversation_id: 'user-123-user-456',
          otherUser: {
            id: 'user-456',
            name: 'User 456',
            profile_image: 'profile.jpg'
          }
        },
        {
          id: 'message-3',
          sender_id: 'user-789',
          recipient_id: 'user-123',
          content: 'Hey there',
          is_read: false,
          created_at: new Date(),
          conversation_id: 'user-123-user-789',
          otherUser: {
            id: 'user-789',
            name: 'User 789',
            profile_image: null
          }
        }
      ];

      mockMessageService.getUserConversations.mockResolvedValueOnce(mockConversations);

      await messageController.getUserConversations(req, res);

      expect(mockMessageService.getUserConversations).toHaveBeenCalledWith('user-123', 20, 0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockConversations);
    });

    it('should return 401 if user is not authenticated', async () => {
      const { req, res } = createMockReqRes();
      req.user = undefined;

      await messageController.getUserConversations(req, res);

      expect(mockMessageService.getUserConversations).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      const { req, res } = createMockReqRes();
      req.params.messageId = 'message-123';

      mockMessageService.markMessageAsRead.mockResolvedValueOnce(true);

      await messageController.markMessageAsRead(req, res);

      expect(mockMessageService.markMessageAsRead).toHaveBeenCalledWith('message-123', 'user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 if message not found or already read', async () => {
      const { req, res } = createMockReqRes();
      req.params.messageId = 'message-123';

      mockMessageService.markMessageAsRead.mockResolvedValueOnce(false);

      await messageController.markMessageAsRead(req, res);

      expect(mockMessageService.markMessageAsRead).toHaveBeenCalledWith('message-123', 'user-123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found or already read' });
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in a conversation as read', async () => {
      const { req, res } = createMockReqRes();
      req.params.userId = 'user-456';

      mockMessageService.markConversationAsRead.mockResolvedValueOnce(5);

      await messageController.markConversationAsRead(req, res);

      expect(mockMessageService.markConversationAsRead).toHaveBeenCalledWith('user-123', 'user-456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 });
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return the count of unread messages for a user', async () => {
      const { req, res } = createMockReqRes();

      mockMessageService.getUnreadMessageCount.mockResolvedValueOnce(3);

      await messageController.getUnreadMessageCount(req, res);

      expect(mockMessageService.getUnreadMessageCount).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
    });
  });
});