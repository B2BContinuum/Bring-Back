import { Pool } from 'pg';
import { MessageRepository } from '../MessageRepository';
import { MessageCreateParams } from '../../models/Message';

// Mock the pg Pool
jest.mock('pg', () => {
  const mockQuery = jest.fn();
  const MockPool = jest.fn(() => ({
    query: mockQuery,
  }));
  return { Pool: MockPool };
});

describe('MessageRepository', () => {
  let messageRepository: MessageRepository;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool() as jest.Mocked<Pool>;
    messageRepository = new MessageRepository(mockPool);
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const mockMessage: MessageCreateParams = {
        sender_id: 'sender-123',
        recipient_id: 'recipient-456',
        content: 'Hello, this is a test message',
        related_request_id: 'request-789'
      };

      const mockResult = {
        rows: [{
          id: 'message-123',
          sender_id: mockMessage.sender_id,
          recipient_id: mockMessage.recipient_id,
          content: mockMessage.content,
          is_read: false,
          related_request_id: mockMessage.related_request_id,
          related_trip_id: null,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.createMessage(mockMessage);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        [
          mockMessage.sender_id,
          mockMessage.recipient_id,
          mockMessage.content,
          mockMessage.related_request_id,
          null
        ]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('getMessageById', () => {
    it('should return a message by id', async () => {
      const mockMessageId = 'message-123';
      const mockMessage = {
        id: mockMessageId,
        sender_id: 'sender-123',
        recipient_id: 'recipient-456',
        content: 'Hello, this is a test message',
        is_read: false,
        related_request_id: 'request-789',
        related_trip_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockResult = {
        rows: [mockMessage]
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.getMessageById(mockMessageId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockMessageId]
      );
      expect(result).toEqual(mockMessage);
    });

    it('should return null if message not found', async () => {
      const mockMessageId = 'non-existent-id';
      const mockResult = {
        rows: []
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.getMessageById(mockMessageId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockMessageId]
      );
      expect(result).toBeNull();
    });
  });

  describe('getMessagesByConversation', () => {
    it('should return messages between two users', async () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const mockMessages = [
        {
          id: 'message-1',
          sender_id: userId1,
          recipient_id: userId2,
          content: 'Hello',
          is_read: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'message-2',
          sender_id: userId2,
          recipient_id: userId1,
          content: 'Hi there',
          is_read: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const mockResult = {
        rows: mockMessages
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.getMessagesByConversation(userId1, userId2, 10, 0);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId1, userId2, 10, 0]
      );
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getConversations', () => {
    it('should return all conversations for a user', async () => {
      const userId = 'user-123';
      const mockConversations = [
        {
          id: 'message-1',
          sender_id: userId,
          recipient_id: 'user-456',
          content: 'Hello',
          is_read: true,
          created_at: new Date(),
          conversation_id: 'user-123-user-456'
        },
        {
          id: 'message-3',
          sender_id: 'user-789',
          recipient_id: userId,
          content: 'Hey there',
          is_read: false,
          created_at: new Date(),
          conversation_id: 'user-123-user-789'
        }
      ];

      const mockResult = {
        rows: mockConversations
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.getConversations(userId, 20, 0);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WITH latest_messages'),
        [userId, 20, 0]
      );
      expect(result).toEqual(mockConversations);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      const messageId = 'message-123';
      const mockResult = {
        rowCount: 1
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.markMessageAsRead(messageId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages'),
        [messageId]
      );
      expect(result).toBe(true);
    });

    it('should return false if message not found', async () => {
      const messageId = 'non-existent-id';
      const mockResult = {
        rowCount: 0
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.markMessageAsRead(messageId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages'),
        [messageId]
      );
      expect(result).toBe(false);
    });
  });

  describe('markAllMessagesAsRead', () => {
    it('should mark all messages from a sender to a recipient as read', async () => {
      const recipientId = 'recipient-123';
      const senderId = 'sender-456';
      const mockResult = {
        rowCount: 5
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.markAllMessagesAsRead(recipientId, senderId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages'),
        [recipientId, senderId]
      );
      expect(result).toBe(5);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return the count of unread messages for a user', async () => {
      const userId = 'user-123';
      const mockResult = {
        rows: [{ count: '3' }]
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await messageRepository.getUnreadMessageCount(userId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        [userId]
      );
      expect(result).toBe(3);
    });
  });
});