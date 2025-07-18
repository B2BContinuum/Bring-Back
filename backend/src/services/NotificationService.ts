import { IDeviceTokenRepository } from '../repositories/DeviceTokenRepository';
import { INotificationRepository } from '../repositories/NotificationRepository';
import { ITripRepository } from '../repositories/TripRepository';
import { IRequestRepository } from '../repositories/RequestRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { IPaymentRepository } from '../repositories/PaymentRepository';
import { Notification } from '../models/Notification';
import axios from 'axios';
import { formatTemplate } from '../utils/templateFormatter';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface PushNotificationTarget {
  userId: string;
  deviceTokens: string[];
}

export enum NotificationType {
  TRIP_ANNOUNCED = 'trip_announced',
  REQUEST_RECEIVED = 'request_received',
  REQUEST_ACCEPTED = 'request_accepted',
  STATUS_UPDATE = 'status_update',
  PAYMENT_COMPLETED = 'payment_completed',
  MESSAGE_RECEIVED = 'message_received'
}

export interface INotificationService {
  sendPushNotification(target: PushNotificationTarget, payload: NotificationPayload): Promise<boolean>;
  sendBulkNotifications(targets: PushNotificationTarget[], payload: NotificationPayload): Promise<boolean[]>;
  notifyTripAnnouncement(tripId: string, nearbyUserIds: string[]): Promise<void>;
  notifyRequestReceived(requestId: string, travelerId: string): Promise<void>;
  notifyRequestAccepted(requestId: string, requesterId: string): Promise<void>;
  notifyStatusUpdate(tripId: string, status: string, userIds: string[]): Promise<void>;
  notifyPaymentCompleted(transactionId: string, userId: string): Promise<void>;
  registerDeviceToken(userId: string, deviceToken: string, deviceType: string): Promise<boolean>;
  unregisterDeviceToken(userId: string, deviceToken: string): Promise<boolean>;
  getUserNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  getDeviceTokensByUserId(userId: string): Promise<string[]>;
}

export class NotificationService implements INotificationService {
  private deviceTokenRepository: IDeviceTokenRepository;
  private notificationRepository: INotificationRepository;
  private tripRepository: ITripRepository;
  private requestRepository: IRequestRepository;
  private userRepository: IUserRepository;
  private paymentRepository: IPaymentRepository;
  private fcmApiKey: string;
  private fcmUrl: string = 'https://fcm.googleapis.com/fcm/send';

  constructor(
    deviceTokenRepository: IDeviceTokenRepository,
    notificationRepository: INotificationRepository,
    tripRepository: ITripRepository,
    requestRepository: IRequestRepository,
    userRepository: IUserRepository,
    paymentRepository: IPaymentRepository,
    fcmApiKey: string
  ) {
    this.deviceTokenRepository = deviceTokenRepository;
    this.notificationRepository = notificationRepository;
    this.tripRepository = tripRepository;
    this.requestRepository = requestRepository;
    this.userRepository = userRepository;
    this.paymentRepository = paymentRepository;
    this.fcmApiKey = fcmApiKey;
  }

  async sendPushNotification(target: PushNotificationTarget, payload: NotificationPayload): Promise<boolean> {
    if (!target.deviceTokens.length) {
      return false;
    }

    try {
      const message = {
        registration_ids: target.deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.imageUrl
        },
        data: payload.data || {}
      };

      const response = await axios.post(this.fcmUrl, message, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.fcmApiKey}`
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async sendBulkNotifications(targets: PushNotificationTarget[], payload: NotificationPayload): Promise<boolean[]> {
    const results: Promise<boolean>[] = targets.map(target => 
      this.sendPushNotification(target, payload)
    );
    
    return Promise.all(results);
  }

  async notifyTripAnnouncement(tripId: string, nearbyUserIds: string[]): Promise<void> {
    if (!nearbyUserIds.length) {
      return;
    }

    try {
      // Get trip details
      const trip = await this.tripRepository.getTripById(tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Get traveler details
      const traveler = await this.userRepository.getUserById(trip.user_id);
      if (!traveler) {
        throw new Error(`Traveler not found: ${trip.user_id}`);
      }

      // Get location details
      const location = await this.tripRepository.getTripDestination(tripId);
      if (!location) {
        throw new Error(`Location not found for trip: ${tripId}`);
      }

      // Get notification template
      const template = await this.notificationRepository.getNotificationTemplate(NotificationType.TRIP_ANNOUNCED);
      if (!template) {
        throw new Error('Trip announcement notification template not found');
      }

      // Format template with data
      const departureTime = new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const templateData = {
        traveler_name: traveler.name,
        location_name: location.name,
        departure_time: departureTime
      };

      const title = formatTemplate(template.title_template, templateData);
      const body = formatTemplate(template.body_template, templateData);

      // Get device tokens for all nearby users
      const deviceTokensMap = await this.deviceTokenRepository.getDeviceTokensByUserIds(nearbyUserIds);
      
      // Prepare notification targets
      const targets: PushNotificationTarget[] = [];
      
      for (const [userId, tokens] of deviceTokensMap.entries()) {
        if (tokens.length > 0) {
          targets.push({
            userId,
            deviceTokens: tokens.map(t => t.device_token)
          });
        }
      }

      // Send push notifications
      if (targets.length > 0) {
        const payload: NotificationPayload = {
          title,
          body,
          data: {
            type: NotificationType.TRIP_ANNOUNCED,
            tripId,
            travelerId: trip.user_id,
            locationId: location.id
          }
        };

        await this.sendBulkNotifications(targets, payload);
      }

      // Store notifications in database
      const notificationPromises = nearbyUserIds.map(userId => 
        this.notificationRepository.createNotification({
          user_id: userId,
          type: NotificationType.TRIP_ANNOUNCED,
          title,
          body,
          data: {
            tripId,
            travelerId: trip.user_id,
            locationId: location.id
          },
          is_read: false
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending trip announcement notifications:', error);
      throw error;
    }
  }

  async notifyRequestReceived(requestId: string, travelerId: string): Promise<void> {
    try {
      // Get request details
      const request = await this.requestRepository.getRequestById(requestId);
      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }

      // Get requester details
      const requester = await this.userRepository.getUserById(request.requester_id);
      if (!requester) {
        throw new Error(`Requester not found: ${request.requester_id}`);
      }

      // Get trip and location details
      const trip = await this.tripRepository.getTripById(request.trip_id);
      if (!trip) {
        throw new Error(`Trip not found: ${request.trip_id}`);
      }

      const location = await this.tripRepository.getTripDestination(request.trip_id);
      if (!location) {
        throw new Error(`Location not found for trip: ${request.trip_id}`);
      }

      // Get notification template
      const template = await this.notificationRepository.getNotificationTemplate(NotificationType.REQUEST_RECEIVED);
      if (!template) {
        throw new Error('Request received notification template not found');
      }

      // Format template with data
      const templateData = {
        requester_name: requester.name,
        location_name: location.name
      };

      const title = formatTemplate(template.title_template, templateData);
      const body = formatTemplate(template.body_template, templateData);

      // Get device tokens for traveler
      const deviceTokens = await this.deviceTokenRepository.getDeviceTokensByUserId(travelerId);
      
      if (deviceTokens.length > 0) {
        // Send push notification
        const target: PushNotificationTarget = {
          userId: travelerId,
          deviceTokens: deviceTokens.map(t => t.device_token)
        };

        const payload: NotificationPayload = {
          title,
          body,
          data: {
            type: NotificationType.REQUEST_RECEIVED,
            requestId,
            requesterId: request.requester_id,
            tripId: request.trip_id
          }
        };

        await this.sendPushNotification(target, payload);
      }

      // Store notification in database
      await this.notificationRepository.createNotification({
        user_id: travelerId,
        type: NotificationType.REQUEST_RECEIVED,
        title,
        body,
        data: {
          requestId,
          requesterId: request.requester_id,
          tripId: request.trip_id
        },
        is_read: false
      });
    } catch (error) {
      console.error('Error sending request received notification:', error);
      throw error;
    }
  }

  async notifyRequestAccepted(requestId: string, requesterId: string): Promise<void> {
    try {
      // Get request details
      const request = await this.requestRepository.getRequestById(requestId);
      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }

      // Get trip details
      const trip = await this.tripRepository.getTripById(request.trip_id);
      if (!trip) {
        throw new Error(`Trip not found: ${request.trip_id}`);
      }

      // Get traveler details
      const traveler = await this.userRepository.getUserById(trip.user_id);
      if (!traveler) {
        throw new Error(`Traveler not found: ${trip.user_id}`);
      }

      // Get location details
      const location = await this.tripRepository.getTripDestination(request.trip_id);
      if (!location) {
        throw new Error(`Location not found for trip: ${request.trip_id}`);
      }

      // Get notification template
      const template = await this.notificationRepository.getNotificationTemplate(NotificationType.REQUEST_ACCEPTED);
      if (!template) {
        throw new Error('Request accepted notification template not found');
      }

      // Format template with data
      const templateData = {
        traveler_name: traveler.name,
        location_name: location.name
      };

      const title = formatTemplate(template.title_template, templateData);
      const body = formatTemplate(template.body_template, templateData);

      // Get device tokens for requester
      const deviceTokens = await this.deviceTokenRepository.getDeviceTokensByUserId(requesterId);
      
      if (deviceTokens.length > 0) {
        // Send push notification
        const target: PushNotificationTarget = {
          userId: requesterId,
          deviceTokens: deviceTokens.map(t => t.device_token)
        };

        const payload: NotificationPayload = {
          title,
          body,
          data: {
            type: NotificationType.REQUEST_ACCEPTED,
            requestId,
            travelerId: trip.user_id,
            tripId: request.trip_id
          }
        };

        await this.sendPushNotification(target, payload);
      }

      // Store notification in database
      await this.notificationRepository.createNotification({
        user_id: requesterId,
        type: NotificationType.REQUEST_ACCEPTED,
        title,
        body,
        data: {
          requestId,
          travelerId: trip.user_id,
          tripId: request.trip_id
        },
        is_read: false
      });
    } catch (error) {
      console.error('Error sending request accepted notification:', error);
      throw error;
    }
  }

  async notifyStatusUpdate(tripId: string, status: string, userIds: string[]): Promise<void> {
    if (!userIds.length) {
      return;
    }

    try {
      // Get trip details
      const trip = await this.tripRepository.getTripById(tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Get traveler details
      const traveler = await this.userRepository.getUserById(trip.user_id);
      if (!traveler) {
        throw new Error(`Traveler not found: ${trip.user_id}`);
      }

      // Get notification template
      const template = await this.notificationRepository.getNotificationTemplate(NotificationType.STATUS_UPDATE);
      if (!template) {
        throw new Error('Status update notification template not found');
      }

      // Format status message based on trip status
      let message = '';
      switch (status) {
        case 'in_progress':
          message = `${traveler.name} has started the trip`;
          break;
        case 'at_destination':
          message = `${traveler.name} has arrived at the destination`;
          break;
        case 'returning':
          message = `${traveler.name} is returning with your items`;
          break;
        case 'completed':
          message = `${traveler.name} has completed the trip`;
          break;
        case 'cancelled':
          message = `${traveler.name} has cancelled the trip`;
          break;
        default:
          message = `Trip status has been updated to ${status}`;
      }

      // Format template with data
      const templateData = {
        status: status.replace('_', ' '),
        message
      };

      const title = formatTemplate(template.title_template, templateData);
      const body = formatTemplate(template.body_template, templateData);

      // Get device tokens for all users
      const deviceTokensMap = await this.deviceTokenRepository.getDeviceTokensByUserIds(userIds);
      
      // Prepare notification targets
      const targets: PushNotificationTarget[] = [];
      
      for (const [userId, tokens] of deviceTokensMap.entries()) {
        if (tokens.length > 0) {
          targets.push({
            userId,
            deviceTokens: tokens.map(t => t.device_token)
          });
        }
      }

      // Send push notifications
      if (targets.length > 0) {
        const payload: NotificationPayload = {
          title,
          body,
          data: {
            type: NotificationType.STATUS_UPDATE,
            tripId,
            travelerId: trip.user_id,
            status
          }
        };

        await this.sendBulkNotifications(targets, payload);
      }

      // Store notifications in database
      const notificationPromises = userIds.map(userId => 
        this.notificationRepository.createNotification({
          user_id: userId,
          type: NotificationType.STATUS_UPDATE,
          title,
          body,
          data: {
            tripId,
            travelerId: trip.user_id,
            status
          },
          is_read: false
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending status update notifications:', error);
      throw error;
    }
  }

  async notifyPaymentCompleted(transactionId: string, userId: string): Promise<void> {
    try {
      // Get payment details
      const payment = await this.paymentRepository.getPaymentById(transactionId);
      if (!payment) {
        throw new Error(`Payment not found: ${transactionId}`);
      }

      // Get notification template
      const template = await this.notificationRepository.getNotificationTemplate(NotificationType.PAYMENT_COMPLETED);
      if (!template) {
        throw new Error('Payment completed notification template not found');
      }

      // Format template with data
      const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount);
      const templateData = {
        amount
      };

      const title = formatTemplate(template.title_template, templateData);
      const body = formatTemplate(template.body_template, templateData);

      // Get device tokens for user
      const deviceTokens = await this.deviceTokenRepository.getDeviceTokensByUserId(userId);
      
      if (deviceTokens.length > 0) {
        // Send push notification
        const target: PushNotificationTarget = {
          userId,
          deviceTokens: deviceTokens.map(t => t.device_token)
        };

        const payload: NotificationPayload = {
          title,
          body,
          data: {
            type: NotificationType.PAYMENT_COMPLETED,
            transactionId,
            amount: payment.amount,
            currency: payment.currency
          }
        };

        await this.sendPushNotification(target, payload);
      }

      // Store notification in database
      await this.notificationRepository.createNotification({
        user_id: userId,
        type: NotificationType.PAYMENT_COMPLETED,
        title,
        body,
        data: {
          transactionId,
          amount: payment.amount,
          currency: payment.currency
        },
        is_read: false
      });
    } catch (error) {
      console.error('Error sending payment completed notification:', error);
      throw error;
    }
  }

  async registerDeviceToken(userId: string, deviceToken: string, deviceType: string): Promise<boolean> {
    try {
      await this.deviceTokenRepository.addDeviceToken(userId, deviceToken, deviceType);
      return true;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  async unregisterDeviceToken(userId: string, deviceToken: string): Promise<boolean> {
    try {
      return await this.deviceTokenRepository.removeDeviceToken(userId, deviceToken);
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    return this.notificationRepository.getNotificationsByUserId(userId, limit, offset);
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    return this.notificationRepository.markNotificationAsRead(notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllNotificationsAsRead(userId);
  }

  async getDeviceTokensByUserId(userId: string): Promise<string[]> {
    try {
      const deviceTokens = await this.deviceTokenRepository.getDeviceTokensByUserId(userId);
      return deviceTokens.map(token => token.device_token);
    } catch (error) {
      console.error('Error getting device tokens:', error);
      return [];
    }
  }
}