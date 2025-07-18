import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PaymentMethodSelector from '../../../components/payment/PaymentMethodSelector';

// Mock the usePaymentMethods hook
jest.mock('../../../hooks/usePaymentMethods', () => ({
  usePaymentMethods: jest.fn()
}));

import { usePaymentMethods } from '../../../hooks/usePaymentMethods';

describe('PaymentMethodSelector', () => {
  const mockOnSelectPaymentMethod = jest.fn();
  const mockOnAddPaymentMethod = jest.fn();
  
  const defaultProps = {
    onSelectPaymentMethod: mockOnSelectPaymentMethod,
    onAddPaymentMethod: mockOnAddPaymentMethod
  };
  
  const mockPaymentMethods = [
    {
      id: 'pm_1',
      payment_method_id: 'pm_123456',
      user_id: 'user_1',
      type: 'card',
      last_four: '4242',
      brand: 'visa',
      exp_month: 12,
      exp_year: 2025,
      is_default: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 'pm_2',
      payment_method_id: 'pm_789012',
      user_id: 'user_1',
      type: 'card',
      last_four: '5678',
      brand: 'mastercard',
      exp_month: 10,
      exp_year: 2024,
      is_default: false,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: true,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    expect(screen.getByText('Loading payment methods...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: false,
      error: 'Failed to load payment methods'
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    expect(screen.getByText('Failed to load payment methods')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders payment methods correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: mockPaymentMethods,
      loading: false,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    expect(screen.getByText('Payment Method')).toBeTruthy();
    expect(screen.getByText('Visa •••• 4242')).toBeTruthy();
    expect(screen.getByText('Mastercard •••• 5678')).toBeTruthy();
    expect(screen.getByText('Expires 12/2025')).toBeTruthy();
    expect(screen.getByText('Expires 10/2024')).toBeTruthy();
  });

  it('selects default payment method automatically', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: mockPaymentMethods,
      loading: false,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    // Default payment method should be selected automatically
    expect(mockOnSelectPaymentMethod).toHaveBeenCalledWith('pm_1');
  });

  it('handles payment method selection', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: mockPaymentMethods,
      loading: false,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    // Select the second payment method
    fireEvent.press(screen.getByText('Mastercard •••• 5678'));
    
    expect(mockOnSelectPaymentMethod).toHaveBeenCalledWith('pm_2');
  });

  it('handles add payment method button press', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: mockPaymentMethods,
      loading: false,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    expect(mockOnAddPaymentMethod).toHaveBeenCalled();
  });

  it('renders empty state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: false,
      error: null
    });
    
    render(<PaymentMethodSelector {...defaultProps} />);
    
    expect(screen.getByText('No payment methods available')).toBeTruthy();
    expect(screen.getByText('Add Payment Method')).toBeTruthy();
  });
});