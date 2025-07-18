import { DeliveryRequest as DeliveryRequestModel } from '../models/DeliveryRequest';
import { IRequestRepository } from '../repositories/RequestRepository';
import { ITripRepository } from '../repositories/TripRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { RequestStatus } from '../../../shared/src/types';
import { DeliveryRequest, DeliveryRequestInsert } from '../types/database.types';

export interface IRequestService {
  createRequest(requestData: Partial<DeliveryRequestModel>): Promise<DeliveryRequestModel>;
  getRequestById(id: string): Promise<DeliveryRequestModel | null>;
  getRequestsByTripId(tripId: string): Promise<DeliveryRequestModel[]>;
  getRequestsByRequesterId(requesterId: string): Promise<DeliveryRequestModel[]>;
  acceptRequest(id: string, acceptedAt?: Date): Promise<DeliveryRequestModel | null>;
  updateRequestStatus(id: string, status: RequestStatus): Promise<DeliveryRequestModel | null>;
  completeRequest(id: string, completedAt?: Date): Promise<DeliveryRequestModel | null>;
  cancelRequest(id: string): Promise<boolean>;
  matchRequestsToTrip(tripId: string, maxResults?: number): Promise<DeliveryRequestModel[]>;
  getRequestWithDetails(id: string): Promise<DeliveryRequestModel & { trip: any; requester: any } | null>;
}

export class RequestService implements IRequestService {
  constructor(
    private requestRepository: IRequestRepository,
    private tripRepository: ITripRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Create a new delivery request
   * Requirements: 3.1, 3.2, 3.3, 3.4 - Request creation with items, compensation, and delivery details
   */
  async createRequest(requestData: Partial<DeliveryRequestModel>): Promise<DeliveryRequestModel> {
    // Validate request data
    const validation = DeliveryRequestModel.validateForCreation(requestData);
    if (!validation.isValid) {
      throw new Error(`Invalid request data: ${validation.errors.join(', ')}`);
    }

    // Verify trip exists and has capacity
    const trip = await this.tripRepository.findById(requestData.tripId!);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.available_capacity <= 0) {
      throw new Error('Trip has no available capacity');
    }

    if (trip.status !== 'announced') {
      throw new Error('Trip is not accepting requests');
    }

    // Verify requester exists
    const requester = await this.userRepository.findById(requestData.requesterId!);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Convert to database insert format
    const insertData: DeliveryRequestInsert = {
      trip_id: requestData.tripId!,
      requester_id: requestData.requesterId!,
      items: requestData.items!,
      delivery_address: requestData.deliveryAddress!,
      max_item_budget: requestData.maxItemBudget!,
      delivery_fee: requestData.deliveryFee!,
      special_instructions: requestData.specialInstructions || null,
      status: 'pending', // Default status for new requests
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbRequest = await this.requestRepository.create(insertData);
    
    // Get full request details
    const requestWithDetails = await this.requestRepository.getRequestWithDetails(dbRequest.id);
    if (!requestWithDetails) {
      throw new Error('Failed to retrieve created request details');
    }

    return this.dbRequestToModel(requestWithDetails);
  }

  /**
   * Get request by ID
   */
  async getRequestById(id: string): Promise<DeliveryRequestModel | null> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    const dbRequest = await this.requestRepository.findById(id);
    return dbRequest ? this.dbRequestToModel(dbRequest) : null;
  }

  /**
   * Get requests by trip ID
   * Requirements: 4.1 - Display pending delivery requests for traveler's destination
   */
  async getRequestsByTripId(tripId: string): Promise<DeliveryRequestModel[]> {
    if (!tripId || tripId.trim() === '') {
      throw new Error('Trip ID is required');
    }

    const dbRequests = await this.requestRepository.findByTripId(tripId);
    return dbRequests.map(request => this.dbRequestToModel(request));
  }

  /**
   * Get requests by requester ID
   */
  async getRequestsByRequesterId(requesterId: string): Promise<DeliveryRequestModel[]> {
    if (!requesterId || requesterId.trim() === '') {
      throw new Error('Requester ID is required');
    }

    const dbRequests = await this.requestRepository.findByRequesterId(requesterId);
    return dbRequests.map(request => this.dbRequestToModel(request));
  }

  /**
   * Accept a delivery request
   * Requirements: 4.3 - When a traveler accepts a request, notify the requester
   */
  async acceptRequest(id: string, acceptedAt: Date = new Date()): Promise<DeliveryRequestModel | null> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    // Verify request exists and is in pending status
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    // Verify trip has available capacity
    const trip = await this.tripRepository.findById(request.trip_id);
    if (!trip) {
      throw new Error('Associated trip not found');
    }

    if (trip.available_capacity <= 0) {
      throw new Error('Trip has no available capacity');
    }

    // Accept the request
    const updatedDbRequest = await this.requestRepository.acceptRequest(id, acceptedAt);
    if (!updatedDbRequest) {
      return null;
    }

    // Update trip capacity
    await this.tripRepository.updateCapacity(trip.id, trip.available_capacity - 1);

    // Get full request details
    const requestWithDetails = await this.requestRepository.getRequestWithDetails(id);
    return requestWithDetails ? this.dbRequestToModel(requestWithDetails) : null;
  }

  /**
   * Update request status
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateRequestStatus(id: string, status: RequestStatus): Promise<DeliveryRequestModel | null> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    // Verify request exists
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    // Validate status transition
    this.validateStatusTransition(request.status as any, status);

    const updatedDbRequest = await this.requestRepository.updateStatus(id, status);
    if (!updatedDbRequest) {
      return null;
    }

    // Get full request details
    const requestWithDetails = await this.requestRepository.getRequestWithDetails(id);
    return requestWithDetails ? this.dbRequestToModel(requestWithDetails) : null;
  }

  /**
   * Complete a delivery request
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async completeRequest(id: string, completedAt: Date = new Date()): Promise<DeliveryRequestModel | null> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    // Verify request exists and is in purchased status
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'purchased') {
      throw new Error('Request must be in purchased status to be completed');
    }

    const updatedDbRequest = await this.requestRepository.completeRequest(id, completedAt);
    if (!updatedDbRequest) {
      return null;
    }

    // Get full request details
    const requestWithDetails = await this.requestRepository.getRequestWithDetails(id);
    return requestWithDetails ? this.dbRequestToModel(requestWithDetails) : null;
  }

  /**
   * Cancel a delivery request
   */
  async cancelRequest(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    // Verify request exists and can be cancelled
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending' && request.status !== 'accepted') {
      throw new Error('Only pending or accepted requests can be cancelled');
    }

    // If request was accepted, restore trip capacity
    if (request.status === 'accepted') {
      const trip = await this.tripRepository.findById(request.trip_id);
      if (trip) {
        await this.tripRepository.updateCapacity(trip.id, trip.available_capacity + 1);
      }
    }

    const cancelledRequest = await this.requestRepository.cancelRequest(id);
    return cancelledRequest !== null;
  }

  /**
   * Match requests to a trip based on criteria
   * Requirements: 4.2 - Show item details, compensation offered, and requester information
   */
  async matchRequestsToTrip(tripId: string, maxResults: number = 10): Promise<DeliveryRequestModel[]> {
    if (!tripId || tripId.trim() === '') {
      throw new Error('Trip ID is required');
    }

    // Verify trip exists
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Get pending requests for this trip
    const pendingRequests = await this.requestRepository.findPendingRequestsForTrip(tripId);
    
    // Sort by matching criteria (higher delivery fee first, then earlier creation time)
    const sortedRequests = pendingRequests.sort((a, b) => {
      // First sort by delivery fee (higher first)
      if (b.delivery_fee !== a.delivery_fee) {
        return b.delivery_fee - a.delivery_fee;
      }
      
      // Then sort by creation time (earlier first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    // Limit results
    const limitedRequests = sortedRequests.slice(0, maxResults);
    
    // Convert to model objects
    return limitedRequests.map(request => this.dbRequestToModel(request));
  }

  /**
   * Get request with detailed information about trip and requester
   */
  async getRequestWithDetails(id: string): Promise<DeliveryRequestModel & { trip: any; requester: any } | null> {
    if (!id || id.trim() === '') {
      throw new Error('Request ID is required');
    }

    const requestWithDetails = await this.requestRepository.getRequestWithDetails(id);
    if (!requestWithDetails) {
      return null;
    }

    return this.dbRequestToModel(requestWithDetails) as DeliveryRequestModel & { trip: any; requester: any };
  }

  /**
   * Convert database request to model request
   */
  private dbRequestToModel(dbRequest: DeliveryRequest & { trip?: any; requester?: any }): DeliveryRequestModel {
    // Create request model
    const request = new DeliveryRequestModel({
      id: dbRequest.id,
      tripId: dbRequest.trip_id,
      requesterId: dbRequest.requester_id,
      items: dbRequest.items as any,
      deliveryAddress: dbRequest.delivery_address as any,
      maxItemBudget: dbRequest.max_item_budget,
      deliveryFee: dbRequest.delivery_fee,
      specialInstructions: dbRequest.special_instructions || undefined,
      status: this.mapDbRequestStatusToShared(dbRequest.status),
      createdAt: new Date(dbRequest.created_at),
      acceptedAt: dbRequest.accepted_at ? new Date(dbRequest.accepted_at) : undefined,
      completedAt: dbRequest.completed_at ? new Date(dbRequest.completed_at) : undefined
    });

    // Add trip and requester data if available
    const result = request as any;
    if (dbRequest.trip) {
      result.trip = dbRequest.trip;
    }
    if (dbRequest.requester) {
      result.requester = dbRequest.requester;
    }

    return result;
  }

  /**
   * Map database request status to shared enum
   */
  private mapDbRequestStatusToShared(dbStatus: string): RequestStatus {
    switch (dbStatus) {
      case 'pending':
        return RequestStatus.PENDING;
      case 'accepted':
        return RequestStatus.ACCEPTED;
      case 'purchased':
        return RequestStatus.PURCHASED;
      case 'delivered':
        return RequestStatus.DELIVERED;
      case 'cancelled':
        return RequestStatus.CANCELLED;
      default:
        return RequestStatus.PENDING;
    }
  }

  /**
   * Validate request status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: RequestStatus): void {
    // Define valid status transitions
    const validTransitions: Record<string, RequestStatus[]> = {
      'pending': [RequestStatus.ACCEPTED, RequestStatus.CANCELLED],
      'accepted': [RequestStatus.PURCHASED, RequestStatus.CANCELLED],
      'purchased': [RequestStatus.DELIVERED, RequestStatus.CANCELLED],
      'delivered': [],
      'cancelled': []
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}