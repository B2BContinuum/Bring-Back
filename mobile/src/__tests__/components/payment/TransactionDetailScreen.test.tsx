import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TransactionDetailScreen from '../../../components/payment/TransactionDetailScreen';

// Mock the paymentService
jest.mock('../../../services/paymentService', () => ({
  paymentService: {
    getTransactionDetails: jest.fn()
  }
}));

describe('TransactionDetailScreen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const mockRoute = {
    params: {
      transactionId: 'txn_123456'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the setTimeout function
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(<TransactionDetailScreen navigation={mockNavigation} route={mockRoute} />);
    
    expect(screen.getByText('Loading transaction details...')).toBeTruthy();
  });

  it('renders delivery payment transaction details correctly', async () => {
    render(<TransactionDetailScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Advance timers to complete the mock API call
    jest.advanceTimersByTime(600);
    
    await waitFor(() => {
      // The component should now show transaction details
      expect(screen.queryByText('Loading transaction details...')).toBeFalsy();
    });
    
    // Check if transaction details are rendered
    // Note: Since we're using random data in the component, we can only check for static elements
    expect(screen.getByText('Transaction ID:')).toBeTruthy();
    expect(screen.getByText(mockRoute.params.transactionId)).toBeTruthy();
    expect(screen.getByText('Date:')).toBeTruthy();
    expect(screen.getByText('Back to Wallet')).toBeTruthy();
  });

  it('handles back button press', async () => {
    render(<TransactionDetailScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Advance timers to complete the mock API call
    jest.advanceTimersByTime(600);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading transaction details...')).toBeFalsy();
    });
    
    fireEvent.press(screen.getByText('Back to Wallet'));
    
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('renders error state correctly', () => {
    // Override the setTimeout to simulate an error
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
      // Force the component into error state
      const error = new Error('Failed to fetch transaction');
      // @ts-ignore - we're intentionally calling the callback with an error
      callback(error);
      return null as any;
    });
    
    render(<TransactionDetailScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Advance timers
    jest.advanceTimersByTime(600);
    
    // Check if error state is rendered
    expect(screen.getByText('Failed to fetch transaction details')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('handles retry button press', () => {
    // Override the setTimeout to simulate an error
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
      // Force the component into error state
      const error = new Error('Failed to fetch transaction');
      // @ts-ignore - we're intentionally calling the callback with an error
      callback(error);
      return null as any;
    });
    
    render(<TransactionDetailScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Advance timers
    jest.advanceTimersByTime(600);
    
    // Press retry button
    fireEvent.press(screen.getByText('Try Again'));
    
    // Check if loading state is shown again
    expect(screen.getByText('Loading transaction details...')).toBeTruthy();
  });
});