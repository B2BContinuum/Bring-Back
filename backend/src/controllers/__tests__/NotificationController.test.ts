import { NotificationController } from '../NotificationController';
import { INotificationService } from '../../services/NotificationService';
import { Request, Response } from 'express';

describe('NotificationController', () => {
  // Mock notification service
  const mockNotificationService: INotificationService = {
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
    markAllNotificationsAsRead: jest.fn()
  };

  // Create controller instance
  const notificationController = new NotificationController(mockNotificationService);

  // Mock request and response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    jest.clearAllMocks();
  });

  describe('registerDeviceToken', () => {
    it('should register a device token successfully', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        deviceToken: 'token-1',
        deviceType: 'ios'
      };
      
      (mockNotificationService.registerDeviceToken as jest.Mock).mockResolvedValue(true);

      // Act
      await notificationController.registerDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.registerDeviceToken).toHaveBeenCalledWith('user-1', 'token-1', 'ios');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        // Missing deviceToken and deviceType
      };

      // Act
      await notificationController.registerDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.registerDeviceToken).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should return 500 if registration fails', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        deviceToken: 'token-1',
        deviceType: 'ios'
      };
      
      (mockNotificationService.registerDeviceToken as jest.Mock).mockResolvedValue(false);

      // Act
      await notificationController.registerDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.registerDeviceToken).toHaveBeenCalledWith('user-1', 'token-1', 'ios');
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to register device token' });
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister a device token successfully', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        deviceToken: 'token-1'
      };
      
      (mockNotificationService.unregisterDeviceToken as jest.Mock).mockResolvedValue(true);

      // Act
      await notificationController.unregisterDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.unregisterDeviceToken).toHaveBeenCalledWith('user-1', 'token-1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        // Missing deviceToken
      };

      // Act
      await notificationController.unregisterDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.unregisterDeviceToken).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should return 404 if device token is not found', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-1',
        deviceToken: 'token-1'
      };
      
      (mockNotificationService.unregisterDeviceToken as jest.Mock).mockResolvedValue(false);

      // Act
      await notificationController.unregisterDeviceToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.unregisterDeviceToken).toHaveBeenCalledWith('user-1', 'token-1');
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Device token not found' });
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with default pagination', async () => {
      // Arrange
      mockRequest.params = {
        userId: 'user-1'
      };
      mockRequest.query = {};
      
      const mockNotifications = [{ id: 'notif-1', title: 'Test Notification' }];
      (mockNotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user-1', 20, 0);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockNotifications);
    });

    it('should get user notifications with custom pagination', async () => {
      // Arrange
      mockRequest.params = {
        userId: 'user-1'
      };
      mockRequest.query = {
        limit: '10',
        offset: '5'
      };
      
      const mockNotifications = [{ id: 'notif-1', title: 'Test Notification' }];
      (mockNotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user-1', 10, 5);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockNotifications);
    });

    it('should return 400 if user ID is missing', async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.query = {};

      // Act
      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.getUserNotifications).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'User ID is required' });
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      // Arrange
      mockRequest.params = {
        notificationId: 'notif-1'
      };
      
      (mockNotificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(true);

      // Act
      await notificationController.markNotificationAsRead(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 if notification ID is missing', async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await notificationController.markNotificationAsRead(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.markNotificationAsRead).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Notification ID is required' });
    });

    it('should return 404 if notification is not found', async () => {
      // Arrange
      mockRequest.params = {
        notificationId: 'notif-1'
      };
      
      (mockNotificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(false);

      // Act
      await notificationController.markNotificationAsRead(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      // Arrange
      mockRequest.params = {
        userId: 'user-1'
      };
      
      (mockNotificationService.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(5);

      // Act
      await notificationController.markAllNotificationsAsRead(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.markAllNotificationsAsRead).toHaveBeenCalledWith('user-1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true, count: 5 });
    });

    it('should return 400 if user ID is missing', async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await notificationController.markAllNotificationsAsRead(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockNotificationService.markAllNotificationsAsRead).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'User ID is required' });
    });
  });
});