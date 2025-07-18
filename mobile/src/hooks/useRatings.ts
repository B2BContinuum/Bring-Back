import { useState, useCallback } from 'react';
import { userService } from '../services/userService';

interface RatingSubmission {
  ratedUserId: string;
  rating: number;
  review?: string;
  deliveryRequestId?: string;
}

interface UserRating {
  id: string;
  rating: number;
  review?: string;
  created_at: string;
  rater_user: {
    id: string;
    name: string;
    profile_image?: string;
  };
}

interface UserRatingSummary {
  userId: string;
  userName: string;
  averageRating: number;
  totalRatings: number;
  ratings: UserRating[];
}

export const useRatings = () => {
  const [userRatings, setUserRatings] = useState<UserRatingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUserRatings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user details
      const user = await userService.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user ratings
      const ratings = await userService.getUserRatings(userId);
      
      setUserRatings({
        userId: user.id,
        userName: user.name,
        averageRating: user.rating,
        totalRatings: user.totalDeliveries,
        ratings
      });
      
      return {
        userId: user.id,
        userName: user.name,
        averageRating: user.rating,
        totalRatings: user.totalDeliveries,
        ratings
      };
    } catch (err) {
      setError(err.message || 'Failed to fetch user ratings');
      console.error('Error fetching user ratings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRating = useCallback(async (ratingData: RatingSubmission) => {
    setLoading(true);
    setError(null);
    
    try {
      // Submit the rating
      const result = await userService.submitRating(ratingData);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
      console.error('Error submitting rating:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    userRatings,
    loading,
    error,
    getUserRatings,
    submitRating
  };
};