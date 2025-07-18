import { IMessageRepository } from '../repositories/MessageRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { INotificationService, NotificationType } from './NotificationService';
import { Message, Conversation, MessageCreateParams } from '../models/Message';
import { WebSocketManager } from '../utils/WebSocketManager';

export interface IMessageService {
  sendMessage(message: MessageCreateParams): Promise<Message>;
  getConversation(userId1: string, userId2: string, limit?: number, offset?: number): Promise<Message[]>;
  getUserConversations(userId: string, limit?: number, offset?: number): Promise<Conversation[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<boolean>;
  markConversationAsRead(userId: string, otherUserId: string): Promise<number>;
  getUnreadMessageCount(userId: string): Promise<number>;
}

export class MessageService implements IMessageService {
  private messageRepository: IMessageRepository;
  private userRepository: IUserRepository;
  private notificationService: INotificationService;
  private webSocketManager: WebSocketManager;

  constructor(
    messageRepository: IMessageRepository,
    userRepository: IUserRepository,
    notificationService: INotificationService,
    webSocketManager: WebSocketManager
  ) {
    this.messageRepository = messageRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.webSocketManager = webSocketManager;
  }

  async sendMessage(message: MessageCreateParams): Promise<Message> {
    // Validate users exist
    const [sender, recipient] = await Promise.all([
      this.userRepository.getUserById(message.sender_id),
      this.userRepository.getUserById(message.recipient_id)
    ]);

    if (!sender) {
      throw new Error(`Sender not found: ${message.sender_id}`);
    }

    if (!recipient) {
      throw new Error(`Recipient not found: ${message.recipient_id}`);
    }

    // Create message in database
    const createdMessage = await this.messageRepository.createMessage(message);

    // Send real-time update via WebSocket
    this.webSocketManager.sendToUser(message.recipient_id, 'new_message', {
      message: createdMessage,
      sender: {
        id: sender.id,
        name: sender.name,
        profile_image: sender.profile_image
      }
    });

    // Send push notification
    try {
      // Get device tokens for recipient
      const deviceTokens = await this.notificationService.getDeviceTokensByUserId(message.recipient_id);
      
      if (deviceTokens.length > 0) {
        // Create message preview (truncate if too long)
        const messagePreview = message.content.length > 50 
          ? `${message.content.substring(0, 47)}...` 
          : message.content;

        // Send push notification
        await this.notificationService.sendPushNotification(
          {
            userId: message.recipient_id,
            deviceTokens: deviceTokens
          },
          {
            title: `New message from ${sender.name}`,
            body: messagePreview,
            data: {
              type: NotificationType.MESSAGE_RECEIVED,
              messageId: createdMessage.id,
              senderId: message.sender_id,
              senderName: sender.name
            }
          }
        );
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
      // Don't fail the message send if notification fails
    }

    return createdMessage;
  }

  async getConversation(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.messageRepository.getMessagesByConversation(userId1, userId2, limit, offset);
  }

  async getUserConversations(userId: string, limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    const conversations = await this.messageRepository.getConversations(userId, limit, offset);
    
    // Enhance conversations with user details
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.sender_id === userId ? conversation.recipient_id : conversation.sender_id;
        const otherUser = await this.userRepository.getUserById(otherUserId);
        
        return {
          ...conversation,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            profile_image: otherUser.profile_image
          } : null
        };
      })
    );
    
    return enhancedConversations;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
    const message = await this.messageRepository.getMessageById(messageId);
    
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }
    
    // Only the recipient can mark a message as read
    if (message.recipient_id !== userId) {
      throw new Error('Unauthorized: Only the recipient can mark a message as read');
    }
    
    const result = await this.messageRepository.markMessageAsRead(messageId);
    
    if (result) {
      // Notify sender that message was read via WebSocket
      this.webSocketManager.sendToUser(message.sender_id, 'message_read', {
        messageId,
        readAt: new Date()
      });
    }
    
    return result;
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<number> {
    const count = await this.messageRepository.markAllMessagesAsRead(userId, otherUserId);
    
    if (count > 0) {
      // Notify sender that messages were read via WebSocket
      this.webSocketManager.sendToUser(otherUserId, 'conversation_read', {
        userId,
        otherUserId,
        readAt: new Date()
      });
    }
    
    return count;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return this.messageRepository.getUnreadMessageCount(userId);
  }
}