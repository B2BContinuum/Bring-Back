import axios from 'axios';
import { API_URL } from '../config';
import { DeliveryRequest, RequestItem, RequestStatus, ApiResponse } from '../../../shared/src/types';

export interface CreateRequestData {
  tripId: string;
  requesterId: string;
  items: RequestItem[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  maxItemBudget: number;
  deliveryFee: number;
  specialInstructions?: string;
}

export interface RequestWithDetails extends DeliveryRequest {
  trip: any;
  requester: any;
}

class RequestService {
  /**
   * Create a new delivery request
   */
  async createRequest(requestData: CreateRequestData): Promise<{ request: DeliveryRequest; payment: { clientSecret: string; amount: number } }> {
    try {
      const response = await axios.post<ApiResponse<{ request: DeliveryRequest; payment: { clientSecret: string; amount: number } }>>(
        `${API_URL}/requests`,
        requestData
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to create request');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  /**
   * Get requests for a specific trip
   */
  async getRequestsByTripId(tripId: string): Promise<DeliveryRequest[]> {
    try {
      const response = await axios.get<ApiResponse<DeliveryRequest[]>>(
        `${API_URL}/requests/for-trip/${tripId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to get requests');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting requests by trip ID:', error);
      throw error;
    }
  }

  /**
   * Get requests by requester ID
   */
  async getRequestsByRequesterId(requesterId: string): Promise<DeliveryRequest[]> {
    try {
      const response = await axios.get<ApiResponse<DeliveryRequest[]>>(
        `${API_URL}/requests/by-requester/${requesterId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to get requests');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting requests by requester ID:', error);
      throw error;
    }
  }

  /**
   * Get request by ID with details
   */
  async getRequestWithDetails(requestId: string): Promise<RequestWithDetails> {
    try {
      const response = await axios.get<ApiResponse<RequestWithDetails>>(
        `${API_URL}/requests/${requestId}/details`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to get request details');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting request details:', error);
      throw error;
    }
  }

  /**
   * Accept a delivery request
   */
  async acceptRequest(requestId: string): Promise<DeliveryRequest> {
    try {
      const response = await axios.put<ApiResponse<DeliveryRequest>>(
        `${API_URL}/requests/${requestId}/accept`,
        { acceptedAt: new Date().toISOString() }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to accept request');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestId: string, status: RequestStatus): Promise<DeliveryRequest> {
    try {
      const response = await axios.put<ApiResponse<DeliveryRequest>>(
        `${API_URL}/requests/${requestId}/status`,
        { status }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to update request status');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  /**
   * Complete a delivery request
   */
  async completeRequest(requestId: string): Promise<DeliveryRequest> {
    try {
      const response = await axios.put<ApiResponse<DeliveryRequest>>(
        `${API_URL}/requests/${requestId}/complete`,
        { completedAt: new Date().toISOString() }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to complete request');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }

  /**
   * Cancel a delivery request
   */
  async cancelRequest(requestId: string): Promise<boolean> {
    try {
      const response = await axios.delete<ApiResponse<{ success: boolean }>>(
        `${API_URL}/requests/${requestId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to cancel request');
      }
      
      return response.data.data.success;
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }

  /**
   * Match requests to a trip
   */
  async matchRequestsToTrip(tripId: string, maxResults?: number): Promise<DeliveryRequest[]> {
    try {
      const url = maxResults 
        ? `${API_URL}/requests/match/${tripId}?maxResults=${maxResults}`
        : `${API_URL}/requests/match/${tripId}`;
        
      const response = await axios.get<ApiResponse<DeliveryRequest[]>>(url);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to match requests');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error matching requests to trip:', error);
      throw error;
    }
  }
}

export default new RequestService();