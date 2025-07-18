import { apiClient } from './apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  address?: any;
  rating: number;
  totalDeliveries: number;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RatingSubmission {
  ratedUserId: string;
  rating: number;
  review?: string;
  deliveryRequestId?: string;
}

class UserService {
  /**
   * Get user by ID
   * @param userId - The ID of the user to fetch
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch user');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/api/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch current user');
    }
  }

  /**
   * Update user profile
   * @param updates - The profile updates to apply
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put('/api/users/profile', updates);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }

  /**
   * Get ratings for a user
   * @param userId - The ID of the user to get ratings for
   * @param limit - The maximum number of ratings to return
   */
  async getUserRatings(userId: string, limit: number = 10) {
    try {
      const response = await apiClient.get(`/api/users/${userId}/ratings`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch user ratings');
    }
  }

  /**
   * Submit a rating for a user
   * @param ratingData - The rating data to submit
   */
  async submitRating(ratingData: RatingSubmission) {
    try {
      const response = await apiClient.post(`/api/users/${ratingData.ratedUserId}/rate`, {
        rating: ratingData.rating,
        review: ratingData.review,
        deliveryRequestId: ratingData.deliveryRequestId
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to submit rating');
    }
  }
}

export const userService = new UserService();