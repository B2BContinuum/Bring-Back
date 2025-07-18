import { useState, useCallback } from 'react';
import { Coordinates } from '../types/location.types';
import { 
  checkInToLocation, 
  checkOutFromLocation, 
  getLocationPresence,
  verifyUserLocation
} from '../services/locationService';

export const useLocationPresence = (locationId: string) => {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const count = await getLocationPresence(locationId);
      setUserCount(count);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch user count');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const checkIn = useCallback(async (userCoordinates: Coordinates) => {
    setLoading(true);
    setError(null);
    
    try {
      // First verify the user is actually at the location
      const isVerified = await verifyUserLocation(locationId, userCoordinates);
      
      if (!isVerified) {
        throw new Error('Location verification failed. Please make sure you are at the location.');
      }
      
      await checkInToLocation(locationId);
      setIsCheckedIn(true);
      
      // Update the user count after checking in
      await fetchUserCount();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check in');
    } finally {
      setLoading(false);
    }
  }, [locationId, fetchUserCount]);

  const checkOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await checkOutFromLocation(locationId);
      setIsCheckedIn(false);
      
      // Update the user count after checking out
      await fetchUserCount();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check out');
    } finally {
      setLoading(false);
    }
  }, [locationId, fetchUserCount]);

  return {
    isCheckedIn,
    userCount,
    loading,
    error,
    checkIn,
    checkOut,
    fetchUserCount,
  };
};