import { ITripRepository } from '../repositories/TripRepository';
import { IRequestRepository } from '../repositories/RequestRepository';
import { INotificationService } from './NotificationService';
import { WebSocketManager } from '../utils/WebSocketManager';
import { TripStatus, RequestStatus } from '../../../shared/src/types';

export interface StatusUpdate {
  id: string;
  entityType: 'trip' | 'request';
  entityId: string;
  status: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  photoUrl?: string;
  receiptUrl?: string;
}

export interface StatusTrackingOptions {
  notifyUsers?: boolean;
  sendRealTimeUpdates?: boolean;
}

export interface IStatusTrackingService {
  // Trip status tracking
  updateTripStatus(
    tripId: string, 
    status: TripStatus, 
    options?: StatusTrackingOptions, 
    metadata?: Record<string, any>
  ): Promise<StatusUpdate>;
  
  // Request status tracking
  updateRequestStatus(
    requestId: string, 
    status: RequestStatus, 
    options?: StatusTrackingOptions, 
    metadata?: Record<string, any>
  ): Promise<StatusUpdate>;
  
  // Photo confirmation
  addPhotoConfirmation(
    entityType: 'trip' | 'request',
    entityId: string,
    photoUrl: string,
    metadata?: Record<string, any>
  ): Promise<StatusUpdate>;
  
  // Receipt sharing
  addReceiptConfirmation(
    entityType: 'trip' | 'request',
    entityId: string,
    receiptUrl: string,
    metadata?: Record<string, any>
  ): Promise<StatusUpdate>;
  
  // Get status history
  getStatusHistory(
    entityType: 'trip' | 'request',
    entityId: string,
    limit?: number,
    offset?: number
  ): Promise<StatusUpdate[]>;
  
  // Get latest status
  getLatestStatus(
    entityType: 'trip' | 'request',
    entityId: string
  ): Promise<StatusUpdate | null>;
}

export class StatusTrackingService implements IStatusTrackingService {
  private tripRepository: ITripRepository;
  private requestRepository: IRequestRepository;
  private notificationService: INotificationService;
  private webSocketManager: WebSocketManager;
  
  constructor(
    tripRepository: ITripRepository,
    requestRepository: IRequestRepository,
    notificationService: INotificationService,
    webSocketManager: WebSocketManager
  ) {
    this.tripRepository = tripRepository;
    this.requestRepository = requestRepository;
    this.notificationService = notificationService;
    this.webSocketManager = webSocketManager;
  }
  
  /**
   * Update trip status with tracking
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateTripStatus(
    tripId: string, 
    status: TripStatus, 
    options: StatusTrackingOptions = { notifyUsers: true, sendRealTimeUpdates: true },
    metadata?: Record<string, any>
  ): Promise<StatusUpdate> {
    // Verify trip exists
    const trip = await this.tripRepository.getTripWithDetails(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }
    
    // Update trip status in database
    const updatedTrip = await this.tripRepository.updateStatus(tripId, status);
    if (!updatedTrip) {
      throw new Error(`Failed to update trip status: ${tripId}`);
    }
    
    // Create status update record
    const statusUpdate: StatusUpdate = {
      id: `st_${Date.now()}`,
      entityType: 'trip',
      entityId: tripId,
      status,
      timestamp: new Date(),
      metadata
    };
    
    // Store status update in database
    await this.storeStatusUpdate(statusUpdate);
    
    // Send real-time updates if enabled
    if (options.sendRealTimeUpdates) {
      this.sendRealTimeStatusUpdate(statusUpdate, trip);
    }
    
    // Send notifications if enabled
    if (options.notifyUsers) {
      await this.sendStatusNotifications(statusUpdate, trip);
    }
    
    return statusUpdate;
  }
  
  /**
   * Update request status with tracking
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateRequestStatus(
    requestId: string, 
    status: RequestStatus, 
    options: StatusTrackingOptions = { notifyUsers: true, sendRealTimeUpdates: true },
    metadata?: Record<string, any>
  ): Promise<StatusUpdate> {
    // Verify request exists
    const request = await this.requestRepository.getRequestWithDetails(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }
    
    // Update request status in database
    const updatedRequest = await this.requestRepository.updateStatus(requestId, status);
    if (!updatedRequest) {
      throw new Error(`Failed to update request status: ${requestId}`);
    }
    
    // Create status update record
    const statusUpdate: StatusUpdate = {
      id: `st_${Date.now()}`,
      entityType: 'request',
      entityId: requestId,
      status,
      timestamp: new Date(),
      metadata
    };
    
    // Store status update in database
    await this.storeStatusUpdate(statusUpdate);
    
    // Send real-time updates if enabled
    if (options.sendRealTimeUpdates) {
      this.sendRealTimeStatusUpdate(statusUpdate, request);
    }
    
    // Send notifications if enabled
    if (options.notifyUsers) {
      await this.sendStatusNotifications(statusUpdate, request);
    }
    
    return statusUpdate;
  }
  
  /**
   * Add photo confirmation to a trip or request
   * Requirements: 5.4 - Photo confirmation and receipt sharing
   */
  async addPhotoConfirmation(
    entityType: 'trip' | 'request',
    entityId: string,
    photoUrl: string,
    metadata?: Record<string, any>
  ): Promise<StatusUpdate> {
    // Verify entity exists
    const entity = entityType === 'trip' 
      ? await this.tripRepository.getTripWithDetails(entityId)
      : await this.requestRepository.getRequestWithDetails(entityId);
      
    if (!entity) {
      throw new Error(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found: ${entityId}`);
    }
    
    // Create status update record with photo
    const statusUpdate: StatusUpdate = {
      id: `st_${Date.now()}`,
      entityType,
      entityId,
      status: entityType === 'trip' ? entity.status : entity.status,
      timestamp: new Date(),
      photoUrl,
      metadata: {
        ...metadata,
        confirmationType: 'photo'
      }
    };
    
    // Store status update in database
    await this.storeStatusUpdate(statusUpdate);
    
    // Send real-time updates
    this.sendRealTimeStatusUpdate(statusUpdate, entity);
    
    // Send notifications
    await this.sendStatusNotifications(statusUpdate, entity);
    
    return statusUpdate;
  }
  
  /**
   * Add receipt confirmation to a trip or request
   * Requirements: 5.4 - Photo confirmation and receipt sharing
   */
  async addReceiptConfirmation(
    entityType: 'trip' | 'request',
    entityId: string,
    receiptUrl: string,
    metadata?: Record<string, any>
  ): Promise<StatusUpdate> {
    // Verify entity exists
    const entity = entityType === 'trip' 
      ? await this.tripRepository.getTripWithDetails(entityId)
      : await this.requestRepository.getRequestWithDetails(entityId);
      
    if (!entity) {
      throw new Error(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found: ${entityId}`);
    }
    
    // Create status update record with receipt
    const statusUpdate: StatusUpdate = {
      id: `st_${Date.now()}`,
      entityType,
      entityId,
      status: entityType === 'trip' ? entity.status : entity.status,
      timestamp: new Date(),
      receiptUrl,
      metadata: {
        ...metadata,
        confirmationType: 'receipt'
      }
    };
    
    // Store status update in database
    await this.storeStatusUpdate(statusUpdate);
    
    // Send real-time updates
    this.sendRealTimeStatusUpdate(statusUpdate, entity);
    
    // Send notifications
    await this.sendStatusNotifications(statusUpdate, entity);
    
    return statusUpdate;
  }
  
  /**
   * Get status history for a trip or request
   */
  async getStatusHistory(
    entityType: 'trip' | 'request',
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<StatusUpdate[]> {
    // This would typically query a status_updates table in the database
    // For now, we'll return a mock implementation
    return [];
  }
  
  /**
   * Get latest status for a trip or request
   */
  async getLatestStatus(
    entityType: 'trip' | 'request',
    entityId: string
  ): Promise<StatusUpdate | null> {
    // This would typically query a status_updates table in the database
    // For now, we'll return the current status from the entity
    if (entityType === 'trip') {
      const trip = await this.tripRepository.getTripWithDetails(entityId);
      if (!trip) return null;
      
      return {
        id: `st_latest_${entityId}`,
        entityType: 'trip',
        entityId,
        status: trip.status,
        timestamp: new Date(trip.updated_at)
      };
    } else {
      const request = await this.requestRepository.getRequestWithDetails(entityId);
      if (!request) return null;
      
      return {
        id: `st_latest_${entityId}`,
        entityType: 'request',
        entityId,
        status: request.status,
        timestamp: new Date(request.updated_at)
      };
    }
  }
  
  /**
   * Store status update in database
   * This is a placeholder for actual database storage
   */
  private async storeStatusUpdate(statusUpdate: StatusUpdate): Promise<void> {
    // In a real implementation, this would store the status update in a database table
    console.log(`Storing status update: ${JSON.stringify(statusUpdate)}`);
    // For now, we'll just return as if it succeeded
  }
  
  /**
   * Send real-time status updates via WebSocket
   */
  private sendRealTimeStatusUpdate(statusUpdate: StatusUpdate, entity: any): void {
    try {
      const eventType = `${statusUpdate.entityType}_status_update`;
      
      // For trips, notify all users with requests for this trip
      if (statusUpdate.entityType === 'trip') {
        // The traveler should be notified
        this.webSocketManager.sendToUser(entity.user_id, eventType, statusUpdate);
        
        // In a real implementation, we would query all requesters for this trip
        // and send them updates as well
      } 
      // For requests, notify both the requester and the traveler
      else if (statusUpdate.entityType === 'request') {
        // Notify requester
        this.webSocketManager.sendToUser(entity.requester_id, eventType, statusUpdate);
        
        // Notify traveler (via trip)
        if (entity.trip && entity.trip.user_id) {
          this.webSocketManager.sendToUser(entity.trip.user_id, eventType, statusUpdate);
        }
      }
    } catch (error) {
      console.error('Error sending real-time status update:', error);
    }
  }
  
  /**
   * Send status notifications to relevant users
   */
  private async sendStatusNotifications(statusUpdate: StatusUpdate, entity: any): Promise<void> {
    try {
      // For trips, notify all users with requests for this trip
      if (statusUpdate.entityType === 'trip') {
        // In a real implementation, we would query all requesters for this trip
        const userIds: string[] = []; // This would be populated with requester IDs
        
        if (userIds.length > 0) {
          await this.notificationService.notifyStatusUpdate(
            statusUpdate.entityId,
            statusUpdate.status,
            userIds
          );
        }
      } 
      // For requests, notify the requester
      else if (statusUpdate.entityType === 'request') {
        // Special handling for photo and receipt confirmations
        if (statusUpdate.photoUrl || statusUpdate.receiptUrl) {
          // Custom notification for photo/receipt would be implemented here
          // For now, we'll use the standard status update notification
          await this.notificationService.notifyStatusUpdate(
            entity.trip_id,
            `${statusUpdate.status}_with_${statusUpdate.photoUrl ? 'photo' : 'receipt'}`,
            [entity.requester_id]
          );
        } else {
          // Standard status update notification
          await this.notificationService.notifyStatusUpdate(
            entity.trip_id,
            statusUpdate.status,
            [entity.requester_id]
          );
        }
      }
    } catch (error) {
      console.error('Error sending status notifications:', error);
    }
  }
}