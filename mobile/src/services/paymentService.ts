import { apiClient } from './apiClient';

class PaymentService {
  /**
   * Calculate the total cost for a delivery request
   * @param requestId - The ID of the delivery request
   * @param tip - The tip amount
   */
  async calculateTotalCost(requestId: string, tip: number = 0) {
    try {
      const response = await apiClient.get(`/api/payments/calculate/${requestId}`, {
        params: { tip }
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating total cost:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to calculate total cost');
    }
  }

  /**
   * Process a payment for a delivery request
   * @param requestId - The ID of the delivery request
   * @param amount - The total amount to charge
   * @param paymentMethodId - The ID of the payment method to use
   */
  async processPayment(requestId: string, amount: number, paymentMethodId: string) {
    try {
      const response = await apiClient.post('/api/payments/process', {
        requestId,
        amount,
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to process payment');
    }
  }

  /**
   * Get all payment methods for the current user
   */
  async getPaymentMethods() {
    try {
      const response = await apiClient.get('/api/payments/methods');
      return response.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get payment methods');
    }
  }

  /**
   * Add a new payment method for the current user
   * @param paymentMethodId - The ID of the payment method to add
   */
  async addPaymentMethod(paymentMethodId: string) {
    try {
      const response = await apiClient.post('/api/payments/methods', {
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to add payment method');
    }
  }

  /**
   * Remove a payment method
   * @param paymentMethodId - The ID of the payment method to remove
   */
  async removePaymentMethod(paymentMethodId: string) {
    try {
      const response = await apiClient.delete(`/api/payments/methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to remove payment method');
    }
  }

  /**
   * Set a payment method as the default
   * @param paymentMethodId - The ID of the payment method to set as default
   */
  async setDefaultPaymentMethod(paymentMethodId: string) {
    try {
      const response = await apiClient.put(`/api/payments/methods/${paymentMethodId}/default`);
      return response.data;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to set default payment method');
    }
  }

  /**
   * Get the current user's wallet balance
   */
  async getWalletBalance() {
    try {
      const response = await apiClient.get('/api/payments/wallet');
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get wallet balance');
    }
  }

  /**
   * Get the current user's transaction history
   */
  async getTransactions() {
    try {
      const response = await apiClient.get('/api/payments/transactions');
      return response.data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get transactions');
    }
  }

  /**
   * Request a payout to the user's connected bank account
   */
  async requestPayout() {
    try {
      const response = await apiClient.post('/api/payments/payout');
      return response.data;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to request payout');
    }
  }
}

export const paymentService = new PaymentService();