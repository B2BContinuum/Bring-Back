import { renderHook, act } from '@testing-library/react-hooks';
import { useWallet } from '../../hooks/useWallet';
import { paymentService } from '../../services/paymentService';

// Mock the paymentService
jest.mock('../../services/paymentService', () => ({
  paymentService: {
    getWalletBalance: jest.fn(),
    getTransactions: jest.fn(),
    requestPayout: jest.fn()
  }
}));

describe('useWallet', () => {
  const mockBalance = 75.50;
  const mockTransactions = [
    {
      id: 'txn_1',
      user_id: 'user_1',
      type: 'delivery_payment',
      amount: 25.50,
      status: 'completed',
      reference_id: 'ref_1',
      created_at: '2023-01-15T14:30:00Z',
      updated_at: '2023-01-15T14:30:00Z'
    },
    {
      id: 'txn_2',
      user_id: 'user_1',
      type: 'payout',
      amount: 50.00,
      status: 'completed',
      reference_id: 'ref_2',
      created_at: '2023-01-10T10:15:00Z',
      updated_at: '2023-01-10T10:15:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful responses
    (paymentService.getWalletBalance as jest.Mock).mockResolvedValue({ balance: mockBalance });
    (paymentService.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    (paymentService.requestPayout as jest.Mock).mockResolvedValue({ success: true });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.balance).toBeNull();
    expect(result.current.transactions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches wallet data successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    // Initial state
    expect(result.current.loading).toBe(false);
    
    // Call fetchWalletData
    act(() => {
      result.current.fetchWalletData();
    });
    
    // Should be loading
    expect(result.current.loading).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should have data and not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.balance).toBe(mockBalance);
    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.error).toBeNull();
    
    // Verify service calls
    expect(paymentService.getWalletBalance).toHaveBeenCalledTimes(1);
    expect(paymentService.getTransactions).toHaveBeenCalledTimes(1);
  });

  it('handles fetch wallet data error', async () => {
    const errorMessage = 'Failed to fetch wallet data';
    (paymentService.getWalletBalance as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    // Call fetchWalletData
    act(() => {
      result.current.fetchWalletData().catch(() => {});
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should have error and not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.balance).toBeNull();
    expect(result.current.transactions).toEqual([]);
  });

  it('requests payout successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    // Call requestPayout
    act(() => {
      result.current.requestPayout();
    });
    
    // Should be loading
    expect(result.current.loading).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should not be loading and have no error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verify service calls
    expect(paymentService.requestPayout).toHaveBeenCalledTimes(1);
    expect(paymentService.getWalletBalance).toHaveBeenCalledTimes(1);
    expect(paymentService.getTransactions).toHaveBeenCalledTimes(1);
  });

  it('handles request payout error', async () => {
    const errorMessage = 'Failed to request payout';
    (paymentService.requestPayout as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    // Call requestPayout
    act(() => {
      result.current.requestPayout().catch(() => {});
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should have error and not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    
    // Verify service calls
    expect(paymentService.requestPayout).toHaveBeenCalledTimes(1);
    expect(paymentService.getWalletBalance).not.toHaveBeenCalled();
    expect(paymentService.getTransactions).not.toHaveBeenCalled();
  });
});