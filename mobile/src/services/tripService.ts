import { Trip, TripStatus, ApiResponse, TripSearchParams } from '../../../shared/src/types';
import { API_BASE_URL } from '../config';

/**
 * Service for interacting with trip-related API endpoints
 */
export const tripService = {
  /**
   * Create a new trip
   * @param tripData Trip data to create
   * @returns Promise with created trip
   */
  async createTrip(tripData: Partial<Trip>): Promise<Trip> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      const result: ApiResponse<Trip> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create trip');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  /**
   * Get trip by ID
   * @param tripId Trip ID to fetch
   * @returns Promise with trip details
   */
  async getTripById(tripId: string): Promise<Trip> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`);
      const result: ApiResponse<Trip> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get trip');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting trip:', error);
      throw error;
    }
  },

  /**
   * Get trips by user ID
   * @param userId User ID to fetch trips for
   * @returns Promise with user's trips
   */
  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}`);
      const result: ApiResponse<Trip[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get user trips');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting user trips:', error);
      throw error;
    }
  },

  /**
   * Get nearby trips
   * @param params Search parameters (latitude, longitude, radius)
   * @returns Promise with nearby trips
   */
  async getNearbyTrips(params: TripSearchParams): Promise<Trip[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.latitude !== undefined) {
        queryParams.append('latitude', params.latitude.toString());
      }
      
      if (params.longitude !== undefined) {
        queryParams.append('longitude', params.longitude.toString());
      }
      
      if (params.radius !== undefined) {
        queryParams.append('radius', params.radius.toString());
      }
      
      if (params.departureAfter) {
        queryParams.append('departureAfter', params.departureAfter.toISOString());
      }
      
      if (params.departureBefore) {
        queryParams.append('departureBefore', params.departureBefore.toISOString());
      }
      
      if (params.availableCapacity !== undefined) {
        queryParams.append('availableCapacity', params.availableCapacity.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/trips/nearby?${queryParams.toString()}`);
      const result: ApiResponse<Trip[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get nearby trips');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting nearby trips:', error);
      throw error;
    }
  },

  /**
   * Update trip status
   * @param tripId Trip ID to update
   * @param status New status
   * @returns Promise with updated trip
   */
  async updateTripStatus(tripId: string, status: TripStatus): Promise<Trip> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result: ApiResponse<Trip> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update trip status');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw error;
    }
  },

  /**
   * Update trip capacity
   * @param tripId Trip ID to update
   * @param availableCapacity New available capacity
   * @returns Promise with updated trip
   */
  async updateTripCapacity(tripId: string, availableCapacity: number): Promise<Trip> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/capacity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availableCapacity }),
      });

      const result: ApiResponse<Trip> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update trip capacity');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating trip capacity:', error);
      throw error;
    }
  },

  /**
   * Cancel trip
   * @param tripId Trip ID to cancel
   * @returns Promise with cancelled trip
   */
  async cancelTrip(tripId: string): Promise<Trip> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<Trip> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to cancel trip');
      }

      return result.data;
    } catch (error) {
      console.error('Error cancelling trip:', error);
      throw error;
    }
  },

  /**
   * Get trip with details
   * @param tripId Trip ID to fetch details for
   * @returns Promise with trip details including user info
   */
  async getTripWithDetails(tripId: string): Promise<Trip & { user: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/details`);
      const result: ApiResponse<Trip & { user: any }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get trip details');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting trip details:', error);
      throw error;
    }
  },
};