import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import WalletScreen from '../../../components/payment/WalletScreen';

// Mock the useWallet hook
jest.mock('../../../hooks/useWallet', () => ({
  useWallet: jest.fn()
}));

import { useWallet } from '../../../hooks/useWallet';

describe('WalletScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  
  const mockTransactions = [
    {
      id: 'txn_1',
      type: 'delivery_payment',
      amount: 25.50,
      status: 'completed',
      created_at: '2023-01-15T14:30:00Z',
    },
    {
      id: 'txn_2',
      type: 'payout',
      amount: 50.00,
      status: 'completed',
      created_at: '2023-01-10T10:15:00Z',
    },
    {
      id: 'txn_3',
      type: 'refund',
      amount: 10.00,
      status: 'completed',
      created_at: '2023-01-05T16:45:00Z',
    }
  ];
  
  const mockFetchWalletData = jest.fn();
  const mockRequestPayout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useWallet as jest.Mock).mockReturnValue({
      balance: 75.50,
      transactions: mockTransactions,
      loading: false,
      error: null,
      fetchWalletData: mockFetchWalletData,
      requestPayout: mockRequestPayout
    });
  });

  it('renders correctly with wallet data', () => {
    render(<WalletScreen navigation={mockNavigation} />);
    
    // Check balance display
    expect(screen.getByText('Available Balance')).toBeTruthy();
    expect(screen.getByText('$75.50')).toBeTruthy();
    
    // Check section title
    expect(screen.getByText('Recent Transactions')).toBeTruthy();
    
    // Check transaction items
    expect(screen.getByText('Delivery Payment')).toBeTruthy();
    expect(screen.getByText('Payout')).toBeTruthy();
    expect(screen.getByText('Refund')).toBeTruthy();
    
    // Check transaction amounts
    expect(screen.getByText('+$25.50')).toBeTruthy();
    expect(screen.getByText('-$50.00')).toBeTruthy();
    expect(screen.getByText('+$10.00')).toBeTruthy();
    
    // Check payout button
    expect(screen.getByText('Request Payout')).toBeTruthy();
    
    // Check info text
    expect(screen.getByText('Payouts are typically processed within 2-3 business days')).toBeTruthy();
  });

  it('fetches wallet data on initial render', () => {
    render(<WalletScreen navigation={mockNavigation} />);
    
    expect(mockFetchWalletData).toHaveBeenCalledTimes(1);
  });

  it('handles transaction item press', () => {
    render(<WalletScreen navigation={mockNavigation} />);
    
    // Press the first transaction
    fireEvent.press(screen.getByText('Delivery Payment'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TransactionDetail', { transactionId: 'txn_1' });
  });

  it('handles request payout button press', async () => {
    render(<WalletScreen navigation={mockNavigation} />);
    
    fireEvent.press(screen.getByText('Request Payout'));
    
    expect(mockRequestPayout).toHaveBeenCalledTimes(1);
    
    // After successful payout request, it should refresh wallet data
    await waitFor(() => {
      expect(mockFetchWalletData).toHaveBeenCalledTimes(2);
    });
  });

  it('disables payout button when balance is zero', () => {
    (useWallet as jest.Mock).mockReturnValue({
      balance: 0,
      transactions: mockTransactions,
      loading: false,
      error: null,
      fetchWalletData: mockFetchWalletData,
      requestPayout: mockRequestPayout
    });
    
    render(<WalletScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Request Payout').props.disabled).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    (useWallet as jest.Mock).mockReturnValue({
      balance: null,
      transactions: [],
      loading: true,
      error: null,
      fetchWalletData: mockFetchWalletData,
      requestPayout: mockRequestPayout
    });
    
    render(<WalletScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Loading wallet data...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    (useWallet as jest.Mock).mockReturnValue({
      balance: null,
      transactions: [],
      loading: false,
      error: 'Failed to load wallet data',
      fetchWalletData: mockFetchWalletData,
      requestPayout: mockRequestPayout
    });
    
    render(<WalletScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Failed to load transactions')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders empty state correctly', () => {
    (useWallet as jest.Mock).mockReturnValue({
      balance: 0,
      transactions: [],
      loading: false,
      error: null,
      fetchWalletData: mockFetchWalletData,
      requestPayout: mockRequestPayout
    });
    
    render(<WalletScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('handles refresh control', async () => {
    render(<WalletScreen navigation={mockNavigation} />);
    
    // Trigger refresh
    const flatList = screen.UNSAFE_getByType('FlatList');
    fireEvent(flatList, 'refresh');
    
    expect(mockFetchWalletData).toHaveBeenCalledTimes(2);
  });
});