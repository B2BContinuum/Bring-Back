import { useState, useEffect, useCallback } from 'react';
import { Trip, TripSearchParams, TripStatus } from '../../../shared/src/types';
import { tripService } from '../services/tripService';
import { APP_SETTINGS } from '../config';

interface UseTripsResult {
  userTrips: Trip[];
  nearbyTrips: Trip[];
  selectedTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  fetchUserTrips: (userId: string) => Promise<void>;
  fetchNearbyTrips: (params: TripSearchParams) => Promise<void>;
  fetchTripById: (tripId: string) => Promise<void>;
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<Trip>;
  cancelTrip: (tripId: string) => Promise<Trip>;
}

export const useTrips = (userId?: string): UseTripsResult => {
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [nearbyTrips, setNearbyTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTrips = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const trips = await tripService.getUserTrips(userId);
      setUserTrips(trips);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user trips');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNearbyTrips = useCallback(async (params: TripSearchParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Set default radius if not provided
      if (params.radius === undefined) {
        params.radius = APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM;
      }
      
      const trips = await tripService.getNearbyTrips(params);
      setNearbyTrips(trips);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby trips');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTripById = useCallback(async (tripId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const trip = await tripService.getTripById(tripId);
      setSelectedTrip(trip);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trip details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTrip = useCallback(async (tripData: Partial<Trip>): Promise<Trip> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newTrip = await tripService.createTrip(tripData);
      
      // Update user trips list with the new trip
      setUserTrips(prev => [newTrip, ...prev]);
      
      return newTrip;
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTripStatus = useCallback(async (tripId: string, status: TripStatus): Promise<Trip> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedTrip = await tripService.updateTripStatus(tripId, status);
      
      // Update trip in user trips list
      setUserTrips(prev => 
        prev.map(trip => trip.id === tripId ? updatedTrip : trip)
      );
      
      // Update selected trip if it's the one being updated
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(updatedTrip);
      }
      
      return updatedTrip;
    } catch (err: any) {
      setError(err.message || 'Failed to update trip status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTrip]);

  const cancelTrip = useCallback(async (tripId: string): Promise<Trip> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cancelledTrip = await tripService.cancelTrip(tripId);
      
      // Update trip in user trips list
      setUserTrips(prev => 
        prev.map(trip => trip.id === tripId ? cancelledTrip : trip)
      );
      
      // Update selected trip if it's the one being cancelled
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(cancelledTrip);
      }
      
      return cancelledTrip;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTrip]);

  // Load user trips on initial render if userId is provided
  useEffect(() => {
    if (userId) {
      fetchUserTrips(userId);
    }
  }, [userId, fetchUserTrips]);

  return {
    userTrips,
    nearbyTrips,
    selectedTrip,
    isLoading,
    error,
    fetchUserTrips,
    fetchNearbyTrips,
    fetchTripById,
    createTrip,
    updateTripStatus,
    cancelTrip,
  };
};