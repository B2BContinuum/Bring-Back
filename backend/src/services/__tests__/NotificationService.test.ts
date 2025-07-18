import { NotificationService, NotificationType } from '../NotificationService';
import { DeviceToken } from '../../models/DeviceToken';
import { Notification, NotificationTemplate } from '../../models/Notification';
import { Trip } from '../../models/Trip';
import { DeliveryRequestModel } from '../../models/DeliveryRequest';
import { User } from '../../models/User';
import { Location } from '../../models/Location';
import { Payment } from '../../models/Payment';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationService', () => {
  // Mock repositories
  const mockDeviceTokenRepository = {
    addDeviceToken: jest.fn(),
    removeDeviceToken: jest.fn(),
    getDeviceTokensByUserId: jest.fn(),
    getDeviceTokensByUserIds: jest.fn()
  };

  const mockNotificationRepository = {
    createNotification: jest.fn(),
    getNotificationsByUserId: jest.fn(),
    markNotificationAsRead: jest.fn(),
    markAllNotificationsAsRead: jest.fn(),
    getNotificationTemplate: jest.fn(),
    getAllNotificationTemplates: jest.fn()
  };

  const mockTripRepository = {
    getTripById: jest.fn(),
    getTripDestination: jest.fn()
  };

  const mockRequestRepository = {
    getRequestById: jest.fn()
  };

  const mockUserRepository = {
    getUserById: jest.fn()
  };

  const mockPaymentRepository = {
    getPaymentById: jest.fn()
  };

  // Mock FCM API key
  const mockFcmApiKey = 'mock-fcm-api-key';

  // Create service instance
  const notificationService = new NotificationService(
    mockDeviceTokenRepository as any,
    mockNotificationRepository as any,
    mockTripRepository as any,
    mockRequestRepository as any,
    mockUserRepository as any,
    mockPaymentRepository as any,
    mockFcmApiKey
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPushNotification', () => {
    it('should send a push notification successfully', async () => {
      // Arrange
      const target = {
        userId: 'user-1',
        deviceTokens: ['token-1', 'token-2']
      };
      
      const payload = {
        title: 'Test Title',
        body: 'Test Body',
        data: { key: 'value' }
      };

      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { success: true } });

      // Act
      const result = await notificationService.sendPushNotification(target, payload);

      // Assert
      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://fcm.googleapis.com/fcm/send',
        {
          registration_ids: ['token-1', 'token-2'],
          notification: {
            title: 'Test Title',
            body: 'Test Body',
            image: undefined
          },
          data: { key: 'value' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=mock-fcm-api-key'
          }
        }
      );
    });

    it('should return false if no device tokens are provided', async () => {
      // Arrange
      const target = {
        userId: 'user-1',
        deviceTokens: []
      };
      
      const payload = {
        title: 'Test Title',
        body: 'Test Body'
      };

      // Act
      const result = await notificationService.sendPushNotification(target, payload);

      // Assert
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return false if the FCM API call fails', async () => {
      // Arrange
      const target = {
        userId: 'user-1',
        deviceTokens: ['token-1']
      };
      
      const payload = {
        title: 'Test Title',
        body: 'Test Body'
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('FCM API error'));

      // Act
      const result = await notificationService.sendPushNotification(target, payload);

      // Assert
      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications and return results', async () => {
      // Arrange
      const targets = [
        {
          userId: 'user-1',
          deviceTokens: ['token-1']
        },
        {
          userId: 'user-2',
          deviceTokens: ['token-2']
        }
      ];
      
      const payload = {
        title: 'Test Title',
        body: 'Test Body'
      };

      // Mock implementation for sendPushNotification
      jest.spyOn(notificationService, 'sendPushNotification')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const results = await notificationService.sendBulkNotifications(targets, payload);

      // Assert
      expect(results).toEqual([true, false]);
      expect(notificationService.sendPushNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.sendPushNotification).toHaveBeenCalledWith(targets[0], payload);
      expect(notificationService.sendPushNotification).toHaveBeenCalledWith(targets[1], payload);
    });
  });

  describe('notifyTripAnnouncement', () => {
    it('should send trip announcement notifications to nearby users', async () => {
      // Arrange
      const tripId = 'trip-1';
      const nearbyUserIds = ['user-1', 'user-2'];
      
      const mockTrip: Trip = {
        id: tripId,
        user_id: 'traveler-1',
        destination_id: 'location-1',
        departure_time: new Date(),
        estimated_return_time: new Date(),
        capacity: 3,
        available_capacity: 2,
        status: 'announced',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockTraveler: User = {
        id: 'traveler-1',
        email: 'traveler@example.com',
        name: 'John Traveler',
        phone: '123-456-7890',
        address: { street: '123 Main St', city: 'City', state: 'State', zip: '12345' },
        rating: 4.5,
        total_deliveries: 10,
        verification_status: 'verified',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockLocation: Location = {
        id: 'location-1',
        name: 'Grocery Store',
        address: { street: '456 Market St', city: 'City', state: 'State', zip: '12345' },
        coordinates: { x: 123, y: 456 },
        category: 'grocery',
        verified: true,
        current_user_count: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockTemplate: NotificationTemplate = {
        id: 'template-1',
        type: NotificationType.TRIP_ANNOUNCED,
        title_template: '{{traveler_name}} is going to {{location_name}}',
        body_template: 'Need anything? They\'re leaving at {{departure_time}}',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockDeviceTokens: Map<string, DeviceToken[]> = new Map([
        ['user-1', [{ id: 'dt-1', user_id: 'user-1', device_token: 'token-1', device_type: 'ios', is_active: true, created_at: new Date(), updated_at: new Date() }]],
        ['user-2', [{ id: 'dt-2', user_id: 'user-2', device_token: 'token-2', device_type: 'android', is_active: true, created_at: new Date(), updated_at: new Date() }]]
      ]);

      // Set up mocks
      mockTripRepository.getTripById.mockResolvedValue(mockTrip);
      mockUserRepository.getUserById.mockResolvedValue(mockTraveler);
      mockTripRepository.getTripDestination.mockResolvedValue(mockLocation);
      mockNotificationRepository.getNotificationTemplate.mockResolvedValue(mockTemplate);
      mockDeviceTokenRepository.getDeviceTokensByUserIds.mockResolvedValue(mockDeviceTokens);
      
      // Mock sendBulkNotifications
      jest.spyOn(notificationService, 'sendBulkNotifications').mockResolvedValue([true, true]);

      // Act
      await notificationService.notifyTripAnnouncement(tripId, nearbyUserIds);

      // Assert
      expect(mockTripRepository.getTripById).toHaveBeenCalledWith(tripId);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('traveler-1');
      expect(mockTripRepository.getTripDestination).toHaveBeenCalledWith(tripId);
      expect(mockNotificationRepository.getNotificationTemplate).toHaveBeenCalledWith(NotificationType.TRIP_ANNOUNCED);
      expect(mockDeviceTokenRepository.getDeviceTokensByUserIds).toHaveBeenCalledWith(nearbyUserIds);
      
      expect(notificationService.sendBulkNotifications).toHaveBeenCalledWith(
        [
          { userId: 'user-1', deviceTokens: ['token-1'] },
          { userId: 'user-2', deviceTokens: ['token-2'] }
        ],
        expect.objectContaining({
          title: expect.stringContaining('John Traveler'),
          body: expect.stringContaining('Need anything'),
          data: expect.objectContaining({
            type: NotificationType.TRIP_ANNOUNCED,
            tripId,
            travelerId: 'traveler-1',
            locationId: 'location-1'
          })
        })
      );

      expect(mockNotificationRepository.createNotification).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if there are no nearby users', async () => {
      // Act
      await notificationService.notifyTripAnnouncement('trip-1', []);

      // Assert
      expect(mockTripRepository.getTripById).not.toHaveBeenCalled();
      expect(mockNotificationRepository.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('registerDeviceToken', () => {
    it('should register a device token successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const deviceToken = 'token-1';
      const deviceType = 'ios';
      
      mockDeviceTokenRepository.addDeviceToken.mockResolvedValue({
        id: 'dt-1',
        user_id: userId,
        device_token: deviceToken,
        device_type: deviceType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Act
      const result = await notificationService.registerDeviceToken(userId, deviceToken, deviceType);

      // Assert
      expect(result).toBe(true);
      expect(mockDeviceTokenRepository.addDeviceToken).toHaveBeenCalledWith(userId, deviceToken, deviceType);
    });

    it('should return false if registration fails', async () => {
      // Arrange
      const userId = 'user-1';
      const deviceToken = 'token-1';
      const deviceType = 'ios';
      
      mockDeviceTokenRepository.addDeviceToken.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await notificationService.registerDeviceToken(userId, deviceToken, deviceType);

      // Assert
      expect(result).toBe(false);
      expect(mockDeviceTokenRepository.addDeviceToken).toHaveBeenCalledWith(userId, deviceToken, deviceType);
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister a device token successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const deviceToken = 'token-1';
      
      mockDeviceTokenRepository.removeDeviceToken.mockResolvedValue(true);

      // Act
      const result = await notificationService.unregisterDeviceToken(userId, deviceToken);

      // Assert
      expect(result).toBe(true);
      expect(mockDeviceTokenRepository.removeDeviceToken).toHaveBeenCalledWith(userId, deviceToken);
    });

    it('should return false if unregistration fails', async () => {
      // Arrange
      const userId = 'user-1';
      const deviceToken = 'token-1';
      
      mockDeviceTokenRepository.removeDeviceToken.mockResolvedValue(false);

      // Act
      const result = await notificationService.unregisterDeviceToken(userId, deviceToken);

      // Assert
      expect(result).toBe(false);
      expect(mockDeviceTokenRepository.removeDeviceToken).toHaveBeenCalledWith(userId, deviceToken);
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with default pagination', async () => {
      // Arrange
      const userId = 'user-1';
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          user_id: userId,
          type: NotificationType.TRIP_ANNOUNCED,
          title: 'Trip Announced',
          body: 'Someone is going to the store',
          is_read: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      mockNotificationRepository.getNotificationsByUserId.mockResolvedValue(mockNotifications);

      // Act
      const result = await notificationService.getUserNotifications(userId);

      // Assert
      expect(result).toEqual(mockNotifications);
      expect(mockNotificationRepository.getNotificationsByUserId).toHaveBeenCalledWith(userId, 20, 0);
    });

    it('should get user notifications with custom pagination', async () => {
      // Arrange
      const userId = 'user-1';
      const limit = 10;
      const offset = 5;
      const mockNotifications: Notification[] = [];
      
      mockNotificationRepository.getNotificationsByUserId.mockResolvedValue(mockNotifications);

      // Act
      const result = await notificationService.getUserNotifications(userId, limit, offset);

      // Assert
      expect(result).toEqual(mockNotifications);
      expect(mockNotificationRepository.getNotificationsByUserId).toHaveBeenCalledWith(userId, limit, offset);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      // Arrange
      const notificationId = 'notif-1';
      mockNotificationRepository.markNotificationAsRead.mockResolvedValue(true);

      // Act
      const result = await notificationService.markNotificationAsRead(notificationId);

      // Assert
      expect(result).toBe(true);
      expect(mockNotificationRepository.markNotificationAsRead).toHaveBeenCalledWith(notificationId);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      // Arrange
      const userId = 'user-1';
      mockNotificationRepository.markAllNotificationsAsRead.mockResolvedValue(5);

      // Act
      const result = await notificationService.markAllNotificationsAsRead(userId);

      // Assert
      expect(result).toBe(5);
      expect(mockNotificationRepository.markAllNotificationsAsRead).toHaveBeenCalledWith(userId);
    });
  });
});