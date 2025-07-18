import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
}

export const useWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch wallet balance
      const walletData = await paymentService.getWalletBalance();
      setBalance(walletData.balance);
      
      // Fetch recent transactions
      const recentTransactions = await paymentService.getTransactions();
      setTransactions(recentTransactions);
    } catch (err) {
      setError(err.message || 'Failed to fetch wallet data');
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPayout = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.requestPayout();
      // Refresh wallet data after payout request
      await fetchWalletData();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to request payout');
      console.error('Error requesting payout:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWalletData]);

  useEffect(() => {
    fetchWalletData();
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