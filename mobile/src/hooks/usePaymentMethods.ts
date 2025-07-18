import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';

interface PaymentMethod {
  id: string;
  payment_method_id: string;
  user_id: string;
  type: string;
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(err.message || 'Failed to fetch payment methods');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.addPaymentMethod(paymentMethodId);
      // Refresh the list after adding
      await fetchPaymentMethods();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add payment method');
      console.error('Error adding payment method:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.removePaymentMethod(paymentMethodId);
      // Refresh the list after removing
      await fetchPaymentMethods();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to remove payment method');
      console.error('Error removing payment method:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      // Refresh the list after updating
      await fetchPaymentMethods();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to set default payment method');
      console.error('Error setting default payment method:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  };
};