import { useState, useEffect, useCallback } from 'react';
import requestService, { CreateRequestData } from '../services/requestService';
import { DeliveryRequest, RequestStatus } from '../../../shared/src/types';

export const useRequests = (userId?: string, tripId?: string) => {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch requests based on user role (requester or traveler)
  const fetchRequests = useCallback(async () => {
    if (!userId && !tripId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let fetchedRequests: DeliveryRequest[] = [];
      
      if (tripId) {
        // Fetch requests for a specific trip (traveler view)
        fetchedRequests = await requestService.getRequestsByTripId(tripId);
      } else if (userId) {
        // Fetch requests made by this user (requester view)
        fetchedRequests = await requestService.getRequestsByRequesterId(userId);
      }
      
      setRequests(fetchedRequests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [userId, tripId]);

  // Create a new request
  const createRequest = async (requestData: CreateRequestData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestService.createRequest(requestData);
      fetchRequests(); // Refresh the list
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Accept a request (for travelers)
  const acceptRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRequest = await requestService.acceptRequest(requestId);
      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRequest = await requestService.updateRequestStatus(requestId, status);
      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (err: any) {
      setError(err.message || 'Failed to update request status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete a request
  const completeRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRequest = await requestService.completeRequest(requestId);
      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (err: any) {
      setError(err.message || 'Failed to complete request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel a request
  const cancelRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await requestService.cancelRequest(requestId);
      if (success) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load requests on component mount or when dependencies change
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    acceptRequest,
    updateRequestStatus,
    completeRequest,
    cancelRequest
  };
};

export default useRequests;