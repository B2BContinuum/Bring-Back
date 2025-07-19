import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PaymentMethodsScreen from '../../../components/payment/PaymentMethodsScreen';

// Mock the usePaymentMethods hook
jest.mock('../../../hooks/usePaymentMethods', () => ({
  usePaymentMethods: jest.fn()
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate pressing the second button (Remove) if provided
  if (buttons && buttons.length > 1 && buttons[1].onPress) {
    buttons[1].onPress();
  }
  return null;
});

import { usePaymentMethods } from '../../../hooks/usePaymentMethods';

describe('PaymentMethodsScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  
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
  
  const mockFetchPaymentMethods = jest.fn();
  const mockRemovePaymentMethod = jest.fn();
  const mockSetDefaultPaymentMethod = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: mockPaymentMethods,
      loading: false,
      error: null,
      fetchPaymentMethods: mockFetchPaymentMethods,
      removePaymentMethod: mockRemovePaymentMethod,
      setDefaultPaymentMethod: mockSetDefaultPaymentMethod
    });
  });

  it('renders correctly with payment methods', () => {
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Your Payment Methods')).toBeTruthy();
    
    // Check payment method items
    expect(screen.getByText('Visa •••• 4242')).toBeTruthy();
    expect(screen.getByText('Mastercard •••• 5678')).toBeTruthy();
    expect(screen.getByText('Expires 12/2025')).toBeTruthy();
    expect(screen.getByText('Expires 10/2024')).toBeTruthy();
    
    // Check default badge
    expect(screen.getByText('Default')).toBeTruthy();
    
    // Check action buttons
    expect(screen.getByText('Set as Default')).toBeTruthy();
    expect(screen.getAllByText('Remove').length).toBe(2);
    
    // Check add button
    expect(screen.getByText('Add Payment Method')).toBeTruthy();
    
    // Check info text
    expect(screen.getByText('Your payment information is securely stored and encrypted')).toBeTruthy();
  });

  it('fetches payment methods on initial render', () => {
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    expect(mockFetchPaymentMethods).toHaveBeenCalledTimes(1);
  });

  it('handles add payment method button press', () => {
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddPaymentMethod', expect.any(Object));
  });

  it('handles remove payment method', async () => {
    mockRemovePaymentMethod.mockResolvedValue(true);
    
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    // Press remove button for the second payment method
    fireEvent.press(screen.getAllByText('Remove')[1]);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Payment Method',
      'Are you sure you want to remove mastercard •••• 5678?',
      expect.any(Array)
    );
    
    await waitFor(() => {
      expect(mockRemovePaymentMethod).toHaveBeenCalledWith('pm_2');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Payment method removed successfully',
        expect.any(Array)
      );
    });
  });

  it('handles set default payment method', async () => {
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    // Press set as default button
    fireEvent.press(screen.getByText('Set as Default'));
    
    expect(mockSetDefaultPaymentMethod).toHaveBeenCalledWith('pm_2');
  });

  it('handles payment method removal failure', async () => {
    mockRemovePaymentMethod.mockRejectedValue(new Error('Failed to remove payment method'));
    
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    // Press remove button for the second payment method
    fireEvent.press(screen.getAllByText('Remove')[1]);
    
    await waitFor(() => {
      expect(mockRemovePaymentMethod).toHaveBeenCalledWith('pm_2');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to remove payment method: Failed to remove payment method',
        expect.any(Array)
      );
    });
  });

  it('renders loading state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: true,
      error: null,
      fetchPaymentMethods: mockFetchPaymentMethods,
      removePaymentMethod: mockRemovePaymentMethod,
      setDefaultPaymentMethod: mockSetDefaultPaymentMethod
    });
    
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Loading payment methods...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: false,
      error: 'Failed to load payment methods',
      fetchPaymentMethods: mockFetchPaymentMethods,
      removePaymentMethod: mockRemovePaymentMethod,
      setDefaultPaymentMethod: mockSetDefaultPaymentMethod
    });
    
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Failed to load payment methods')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders empty state correctly', () => {
    (usePaymentMethods as jest.Mock).mockReturnValue({
      paymentMethods: [],
      loading: false,
      error: null,
      fetchPaymentMethods: mockFetchPaymentMethods,
      removePaymentMethod: mockRemovePaymentMethod,
      setDefaultPaymentMethod: mockSetDefaultPaymentMethod
    });
    
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('No payment methods added yet')).toBeTruthy();
  });

  it('handles refresh control', () => {
    render(<PaymentMethodsScreen navigation={mockNavigation} />);
    
    // Trigger refresh
    const flatList = screen.UNSAFE_getByType('FlatList');
    fireEvent(flatList, 'refresh');
    
    expect(mockFetchPaymentMethods).toHaveBeenCalledTimes(2);
  });
});