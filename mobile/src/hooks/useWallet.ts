import { useState, useCallback } from 'react';
import { paymentService } from '../services/paymentService';

interface Transaction {
  id: string;
  user_id: string;
  type: 'payout' | 'delivery_payment' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  created_at: string;
  updated_at: string;
}

export const useWallet = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get wallet balance
      const walletData = await paymentService.getWalletBalance();
      setBalance(walletData.balance);
      
      // Get transaction history
      const transactionData = await paymentService.getTransactions();
      setTransactions(transactionData);
      
      return { balance: walletData.balance, transactions: transactionData };
    } catch (err) {
      setError(err.message || 'Failed to fetch wallet data');
      console.error('Error fetching wallet data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPayout = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await paymentService.requestPayout();
      
      // Refresh wallet data after payout request
      await fetchWalletData();
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to request payout');
      console.error('Error requesting payout:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWalletData]);

  return {
    balance,
    transactions,
    loading,
    error,
    fetchWalletData,
    requestPayout
  };
};