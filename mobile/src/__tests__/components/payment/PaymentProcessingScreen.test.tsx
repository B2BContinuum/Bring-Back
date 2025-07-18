import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentProcessingScreen from '../../../components/payment/PaymentProcessingScreen';
import { Alert } from 'react-native';

// Mock the hooks and components
jest.mock('../../../hooks/usePayment', () => ({
  usePayment: jest.fn()
}));

jest.mock('../../../components/payment/PaymentBreakdown', () => {
  const { View, Text } = require('react-native');
  return function MockPaymentBreakdown(props) {
    return (
      <View testID="payment-breakdown">
        <Text>Payment Breakdown</Text>
        <Text>Items: ${props.itemsCost}</Text>
        <Text>Delivery: ${props.deliveryFee}</Text>
        <Text>Tip: ${props.tip}</Text>
        <Text>Total: ${props.total}</Text>
      </View>
    );
  };
});

jest.mock('../../../components/payment/PaymentMethodSelector', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockPaymentMethodSelector(props) {
    return (
      <View testID="payment-method-selector">
        <Text>Payment Method Selector</Text>
        <TouchableOpacity 
          onPress={() => props.onSelectPaymentMethod('pm_123456')}
          testID="select-payment-method"
        >
          <Text>Select Payment Method</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={props.onAddPaymentMethod}
          testID="add-payment-method"
        >
          <Text>Add Payment Method</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../../../components/payment/TipSelector', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockTipSelector(props) {
    return (
      <View testID="tip-selector">
        <Text>Tip Selector</Text>
        <TouchableOpacity 
          onPress={() => props.onTipChange(2.50)}
          testID="select-tip"
        >
          <Text>Select Tip: $2.50</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

import { usePayment } from '../../../hooks/usePayment';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate pressing the first button if provided
  if (buttons && buttons.length > 0 && buttons[0].onPress) {
    buttons[0].onPress();
  }
  return null;
});

describe('PaymentProcessingScreen', () => {
  const mockOnPaymentComplete = jest.fn();
  const mockOnCancel = jest.fn();
  const mockNavigation = { navigate: jest.fn() };
  
  const defaultProps = {
    requestId: 'req_123',
    onPaymentComplete: mockOnPaymentComplete,
    onCancel: mockOnCancel,
    navigation: mockNavigation
  };
  
  const mockPaymentDetails = {
    itemsCost: 25.50,
    deliveryFee: 5.00,
    tip: 0,
    total: 30.50
  };
  
  const mockCalculateTotal = jest.fn();
  const mockProcessPayment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (usePayment as jest.Mock).mockReturnValue({
      paymentDetails: mockPaymentDetails,
      loading: false,
      error: null,
      calculateTotal: mockCalculateTotal,
      processPayment: mockProcessPayment
    });
  });

  it('renders correctly with payment details', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    expect(screen.getByText('Complete Your Payment')).toBeTruthy();
    expect(screen.getByText('Payment Breakdown')).toBeTruthy();
    expect(screen.getByText('Payment Method Selector')).toBeTruthy();
    expect(screen.getByText('Tip Selector')).toBeTruthy();
    expect(screen.getByText('Process Payment')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('calculates total on initial render', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    expect(mockCalculateTotal).toHaveBeenCalledWith(0);
  });

  it('handles tip selection', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    fireEvent.press(screen.getByTestId('select-tip'));
    
    expect(mockCalculateTotal).toHaveBeenCalledWith(2.5);
  });

  it('handles payment method selection', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    fireEvent.press(screen.getByTestId('select-payment-method'));
    
    // Process payment button should be enabled now
    expect(screen.getByText('Process Payment').props.disabled).toBeFalsy();
  });

  it('handles add payment method', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    fireEvent.press(screen.getByTestId('add-payment-method'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddPaymentMethod', expect.any(Object));
  });

  it('handles process payment success', async () => {
    mockProcessPayment.mockResolvedValue({ success: true });
    
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    // Select payment method
    fireEvent.press(screen.getByTestId('select-payment-method'));
    
    // Process payment
    fireEvent.press(screen.getByText('Process Payment'));
    
    await waitFor(() => {
      expect(mockProcessPayment).toHaveBeenCalledWith('pm_123456', 0);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Successful',
        'Your payment has been processed successfully.',
        expect.any(Array)
      );
      expect(mockOnPaymentComplete).toHaveBeenCalled();
    });
  });

  it('handles process payment failure', async () => {
    mockProcessPayment.mockRejectedValue(new Error('Payment failed'));
    
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    // Select payment method
    fireEvent.press(screen.getByTestId('select-payment-method'));
    
    // Process payment
    fireEvent.press(screen.getByText('Process Payment'));
    
    await waitFor(() => {
      expect(mockProcessPayment).toHaveBeenCalledWith('pm_123456', 0);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Failed',
        'There was an error processing your payment: Payment failed',
        expect.any(Array)
      );
    });
  });

  it('handles cancel button press', () => {
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders loading state correctly', () => {
    (usePayment as jest.Mock).mockReturnValue({
      paymentDetails: null,
      loading: true,
      error: null,
      calculateTotal: mockCalculateTotal,
      processPayment: mockProcessPayment
    });
    
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    expect(screen.getByText('Loading payment details...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    (usePayment as jest.Mock).mockReturnValue({
      paymentDetails: null,
      loading: false,
      error: 'Failed to load payment details',
      calculateTotal: mockCalculateTotal,
      processPayment: mockProcessPayment
    });
    
    render(<PaymentProcessingScreen {...defaultProps} />);
    
    expect(screen.getByText('Error: Failed to load payment details')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });
});