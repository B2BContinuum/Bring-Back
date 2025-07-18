import { supabaseAdmin } from '../config/database';
import { 
  DeliveryRequest, 
  DeliveryRequestInsert, 
  DeliveryRequestUpdate, 
  RequestStatus 
} from '../types/database.types';
import { RequestStatus as SharedRequestStatus } from '../../../shared/src/types';

export interface IRequestRepository {
  create(requestData: DeliveryRequestInsert): Promise<DeliveryRequest>;
  findById(id: string): Promise<DeliveryRequest | null>;
  findByTripId(tripId: string): Promise<DeliveryRequest[]>;
  findByRequesterId(requesterId: string): Promise<DeliveryRequest[]>;
  findPendingRequestsForTrip(tripId: string): Promise<DeliveryRequest[]>;
  findAcceptedRequestsForTrip(tripId: string): Promise<DeliveryRequest[]>;
  findMatchingRequests(tripId: string, maxBudget?: number): Promise<DeliveryRequest[]>;
  updateStatus(id: string, status: SharedRequestStatus): Promise<DeliveryRequest | null>;
  acceptRequest(id: string, acceptedAt?: Date): Promise<DeliveryRequest | null>;
  completeRequest(id: string, completedAt?: Date): Promise<DeliveryRequest | null>;
  update(id: string, updates: DeliveryRequestUpdate): Promise<DeliveryRequest | null>;
  delete(id: string): Promise<boolean>;
  cancelRequest(id: string): Promise<DeliveryRequest | null>;
  getRequestWithDetails(id: string): Promise<DeliveryRequest & { trip: any; requester: any } | null>;
  findActiveRequestsByUser(userId: string): Promise<DeliveryRequest[]>;
  findRequestsByStatus(status: RequestStatus): Promise<DeliveryRequest[]>;
}

export class RequestRepository implements IRequestRepository {
  /**
   * Create a new delivery request
   */
  async create(requestData: DeliveryRequestInsert): Promise<DeliveryRequest> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create delivery request: ${error.message}`);
    }

    return data;
  }

  /**
   * Find delivery request by ID
   */
  async findById(id: string): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find delivery request by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find delivery requests by trip ID
   */
  async findByTripId(tripId: string): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find delivery requests by trip ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find delivery requests by requester ID
   */
  async findByRequesterId(requesterId: string): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('requester_id', requesterId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find delivery requests by requester ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find pending requests for a specific trip
   */
  async findPendingRequestsForTrip(tripId: string): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find pending requests for trip: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find accepted requests for a specific trip
   */
  async findAcceptedRequestsForTrip(tripId: string): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find accepted requests for trip: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find matching requests for a trip based on budget and other criteria
   */
  async findMatchingRequests(tripId: string, maxBudget?: number): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    let query = supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending');

    if (maxBudget) {
      query = query.lte('max_item_budget', maxBudget);
    }

    const { data, error } = await query
      .order('delivery_fee', { ascending: false }) // Higher delivery fee first
      .order('created_at', { ascending: true }); // Earlier requests first

    if (error) {
      throw new Error(`Failed to find matching requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update delivery request status
   */
  async updateStatus(id: string, status: SharedRequestStatus): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Map shared enum to database enum
    const dbStatus = this.mapRequestStatusToDb(status);

    const updateData: any = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    };

    // Set accepted_at timestamp when status changes to accepted
    if (dbStatus === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    }

    // Set completed_at timestamp when status changes to delivered
    if (dbStatus === 'delivered') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update request status: ${error.message}`);
    }

    return data;
  }

  /**
   * Accept a delivery request
   */
  async acceptRequest(id: string, acceptedAt?: Date): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .update({
        status: 'accepted',
        accepted_at: (acceptedAt || new Date()).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to accept request: ${error.message}`);
    }

    return data;
  }

  /**
   * Complete a delivery request
   */
  async completeRequest(id: string, completedAt?: Date): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .update({
        status: 'delivered',
        completed_at: (completedAt || new Date()).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to complete request: ${error.message}`);
    }

    return data;
  }

  /**
   * Update delivery request information
   */
  async update(id: string, updates: DeliveryRequestUpdate): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update delivery request: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete delivery request
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('delivery_requests')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete delivery request: ${error.message}`);
    }

    return true;
  }

  /**
   * Cancel delivery request (soft delete by updating status)
   */
  async cancelRequest(id: string): Promise<DeliveryRequest | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to cancel request: ${error.message}`);
    }

    return data;
  }

  /**
   * Get delivery request with related details (trip and requester info)
   */
  async getRequestWithDetails(id: string): Promise<DeliveryRequest & { trip: any; requester: any } | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select(`
        *,
        trips!delivery_requests_trip_id_fkey (
          id,
          user_id,
          destination_id,
          departure_time,
          estimated_return_time,
          status,
          capacity,
          available_capacity
        ),
        users!delivery_requests_requester_id_fkey (
          id,
          name,
          rating,
          total_deliveries
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get request with details: ${error.message}`);
    }

    return data as DeliveryRequest & { trip: any; requester: any };
  }

  /**
   * Find active requests by user (requester)
   */
  async findActiveRequestsByUser(userId: string): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('requester_id', userId)
      .in('status', ['pending', 'accepted', 'purchased', 'in_transit'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find active requests by user: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find requests by status
   */
  async findRequestsByStatus(status: RequestStatus): Promise<DeliveryRequest[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find requests by status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Map shared RequestStatus enum to database enum
   */
  private mapRequestStatusToDb(status: SharedRequestStatus): RequestStatus {
    switch (status) {
      case SharedRequestStatus.PENDING:
        return 'pending';
      case SharedRequestStatus.ACCEPTED:
        return 'accepted';
      case SharedRequestStatus.PURCHASED:
        return 'purchased';
      case SharedRequestStatus.DELIVERED:
        return 'delivered';
      case SharedRequestStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}