import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { paymentService } from '../services/paymentService';

interface PaymentDetails {
  itemsCost: number;
  deliveryFee: number;
  tip: number;
  total: number;
}

export const usePayment = (requestId: string) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTotal = useCallback(async (tip: number = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await paymentService.calculateTotalCost(requestId, tip);
      setPaymentDetails(result);
    } catch (err) {
      setError(err.message || 'Failed to calculate payment total');
      console.error('Error calculating payment total:', err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const processPayment = useCallback(async (paymentMethodId: string, tip: number = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, calculate the final total with the tip
      const costBreakdown = await paymentService.calculateTotalCost(requestId, tip);
      
      // Then process the payment
      const result = await paymentService.processPayment(
        requestId,
        costBreakdown.total,
        paymentMethodId
      );
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to process payment');
      console.error('Error processing payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  return {
    paymentDetails,
    loading,
    error,
    calculateTotal,
    processPayment
  };
};