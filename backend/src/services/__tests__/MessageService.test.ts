import { MessageService } from '../MessageService';
import { IMessageRepository } from '../../repositories/MessageRepository';
import { IUserRepository } from '../../repositories/UserRepository';
import { INotificationService } from '../NotificationService';
import { WebSocketManager } from '../../utils/WebSocketManager';
import { Message, Conversation, MessageCreateParams } from '../../models/Message';

// Create mocks
const mockMessageRepository: jest.Mocked<IMessageRepository> = {
  createMessage: jest.fn(),
  getMessageById: jest.fn(),
  getMessagesByConversation: jest.fn(),
  getConversations: jest.fn(),
  markMessageAsRead: jest.fn(),
  markAllMessagesAsRead: jest.fn(),
  getUnreadMessageCount: jest.fn()
};

const mockUserRepository: jest.Mocked<IUserRepository> = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserRatings: jest.fn(),
  createUserRating: jest.fn(),
  getUserAverageRating: jest.fn(),
  updateUserRating: jest.fn(),
  searchUsers: jest.fn()
};

const mockNotificationService: jest.Mocked<INotificationService> = {
  sendPushNotification: jest.fn(),
  sendBulkNotifications: jest.fn(),
  notifyTripAnnouncement: jest.fn(),
  notifyRequestReceived: jest.fn(),
  notifyRequestAccepted: jest.fn(),
  notifyStatusUpdate: jest.fn(),
  notifyPaymentCompleted: jest.fn(),
  registerDeviceToken: jest.fn(),
  unregisterDeviceToken: jest.fn(),
  getUserNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getDeviceTokensByUserId: jest.fn()
};

const mockWebSocketManager: jest.Mocked<WebSocketManager> = {
  sendToClient: jest.fn(),
  sendToUser: jest.fn(),
  broadcastToAll: jest.fn(),
  getConnectedUserCount: jest.fn(),
  getConnectedClientCount: jest.fn(),
  isUserConnected: jest.fn(),
  shutdown: jest.fn()
} as unknown as jest.Mocked<WebSocketManager>;

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    messageService = new MessageService(
      mockMessageRepository,
      mockUserRepository,
      mockNotificationService,
      mockWebSocketManager
    );
  });

  describe('sendMessage', () => {
    it('should send a message and notify the recipient', async () => {
      // Setup test data
      const messageParams: MessageCreateParams = {
        sender_id: 'sender-123',
        recipient_id: 'recipient-456',
        content: 'Hello, this is a test message'
      };

      const sender = {
        id: 'sender-123',
        name: 'Sender User',
        email: 'sender@example.com',
        profile_image: 'profile.jpg'
      };

      const recipient = {
        id: 'recipient-456',
        name: 'Recipient User',
        email: 'recipient@example.com',
        profile_image: null
      };

      const createdMessage = {
        id: 'message-789',
        ...messageParams,
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const deviceTokens = ['device-token-1', 'device-token-2'];

      // Setup mocks
      mockUserRepository.getUserById
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);
      
      mockMessageRepository.createMessage.mockResolvedValueOnce(createdMessage);
      mockNotificationService.getDeviceTokensByUserId.mockResolvedValueOnce(deviceTokens);
      mockNotificationService.sendPushNotification.mockResolvedValueOnce(true);

      // Execute
      const result = await messageService.sendMessage(messageParams);

      // Verify
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(messageParams.sender_id);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(messageParams.recipient_id);
      expect(mockMessageRepository.createMessage).toHaveBeenCalledWith(messageParams);
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalledWith(
        messageParams.recipient_id,
        'new_message',
        expect.objectContaining({
          message: createdMessage,
          sender: expect.objectContaining({
            id: sender.id,
            name: sender.name
          })
        })
      );
      expect(mockNotificationService.getDeviceTokensByUserId).toHaveBeenCalledWith(messageParams.recipient_id);
      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledWith(
        {
          userId: messageParams.recipient_id,
          deviceTokens
        },
        expect.objectContaining({
          title: expect.stringContaining(sender.name),
          body: messageParams.content
        })
      );
      expect(result).toEqual(createdMessage);
    });

    it('should throw an error if sender does not exist', async () => {
      const messageParams: MessageCreateParams = {
        sender_id: 'non-existent-sender',
        recipient_id: 'recipient-456',
        content: 'Hello'
      };

      mockUserRepository.getUserById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'recipient-456',
          name: 'Recipient',
          email: 'recipient@example.com'
        });

      await expect(messageService.sendMessage(messageParams)).rejects.toThrow('Sender not found');
    });

    it('should throw an error if recipient does not exist', async () => {
      const messageParams: MessageCreateParams = {
        sender_id: 'sender-123',
        recipient_id: 'non-existent-recipient',
        content: 'Hello'
      };

      mockUserRepository.getUserById
        .mockResolvedValueOnce({
          id: 'sender-123',
          name: 'Sender',
          email: 'sender@example.com'
        })
        .mockResolvedValueOnce(null);

      await expect(messageService.sendMessage(messageParams)).rejects.toThrow('Recipient not found');
    });
  });

  describe('getConversation', () => {
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

      mockMessageRepository.getMessagesByConversation.mockResolvedValueOnce(mockMessages);

      const result = await messageService.getConversation(userId1, userId2, 10, 0);

      expect(mockMessageRepository.getMessagesByConversation).toHaveBeenCalledWith(userId1, userId2, 10, 0);
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getUserConversations', () => {
    it('should return enhanced conversations with user details', async () => {
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
          id: 'message-2',
          sender_id: 'user-789',
          recipient_id: userId,
          content: 'Hey there',
          is_read: false,
          created_at: new Date(),
          conversation_id: 'user-123-user-789'
        }
      ];

      const user456 = {
        id: 'user-456',
        name: 'User 456',
        email: 'user456@example.com',
        profile_image: 'profile456.jpg'
      };

      const user789 = {
        id: 'user-789',
        name: 'User 789',
        email: 'user789@example.com',
        profile_image: null
      };

      mockMessageRepository.getConversations.mockResolvedValueOnce(mockConversations);
      mockUserRepository.getUserById
        .mockResolvedValueOnce(user456)
        .mockResolvedValueOnce(user789);

      const result = await messageService.getUserConversations(userId);

      expect(mockMessageRepository.getConversations).toHaveBeenCalledWith(userId, 20, 0);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('user-456');
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('user-789');
      expect(result).toEqual([
        {
          ...mockConversations[0],
          otherUser: {
            id: user456.id,
            name: user456.name,
            profile_image: user456.profile_image
          }
        },
        {
          ...mockConversations[1],
          otherUser: {
            id: user789.id,
            name: user789.name,
            profile_image: user789.profile_image
          }
        }
      ]);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read and notify the sender', async () => {
      const messageId = 'message-123';
      const userId = 'recipient-456';
      const mockMessage = {
        id: messageId,
        sender_id: 'sender-123',
        recipient_id: userId,
        content: 'Hello',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockMessageRepository.getMessageById.mockResolvedValueOnce(mockMessage);
      mockMessageRepository.markMessageAsRead.mockResolvedValueOnce(true);

      const result = await messageService.markMessageAsRead(messageId, userId);

      expect(mockMessageRepository.getMessageById).toHaveBeenCalledWith(messageId);
      expect(mockMessageRepository.markMessageAsRead).toHaveBeenCalledWith(messageId);
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalledWith(
        'sender-123',
        'message_read',
        expect.objectContaining({
          messageId
        })
      );
      expect(result).toBe(true);
    });

    it('should throw an error if message not found', async () => {
      const messageId = 'non-existent-id';
      const userId = 'user-123';

      mockMessageRepository.getMessageById.mockResolvedValueOnce(null);

      await expect(messageService.markMessageAsRead(messageId, userId)).rejects.toThrow('Message not found');
    });

    it('should throw an error if user is not the recipient', async () => {
      const messageId = 'message-123';
      const userId = 'wrong-user';
      const mockMessage = {
        id: messageId,
        sender_id: 'sender-123',
        recipient_id: 'recipient-456',
        content: 'Hello',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockMessageRepository.getMessageById.mockResolvedValueOnce(mockMessage);

      await expect(messageService.markMessageAsRead(messageId, userId)).rejects.toThrow('Unauthorized');
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in a conversation as read', async () => {
      const userId = 'recipient-123';
      const otherUserId = 'sender-456';

      mockMessageRepository.markAllMessagesAsRead.mockResolvedValueOnce(5);

      const result = await messageService.markConversationAsRead(userId, otherUserId);

      expect(mockMessageRepository.markAllMessagesAsRead).toHaveBeenCalledWith(userId, otherUserId);
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalledWith(
        otherUserId,
        'conversation_read',
        expect.objectContaining({
          userId,
          otherUserId
        })
      );
      expect(result).toBe(5);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return the count of unread messages for a user', async () => {
      const userId = 'user-123';

      mockMessageRepository.getUnreadMessageCount.mockResolvedValueOnce(3);

      const result = await messageService.getUnreadMessageCount(userId);

      expect(mockMessageRepository.getUnreadMessageCount).toHaveBeenCalledWith(userId);
      expect(result).toBe(3);
    });
  });
});