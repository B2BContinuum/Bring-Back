import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddPaymentMethodScreen from '../../../components/payment/AddPaymentMethodScreen';

// Mock the usePaymentMethods hook
jest.mock('../../../hooks/usePaymentMethods', () => ({
  usePaymentMethods: jest.fn()
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate pressing the first button if provided
  if (buttons && buttons.length > 0 && buttons[0].onPress) {
    buttons[0].onPress();
  }
  return null;
});

import { usePaymentMethods } from '../../../hooks/usePaymentMethods';

describe('AddPaymentMethodScreen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const mockOnGoBack = jest.fn();
  const mockRoute = {
    params: {
      onGoBack: mockOnGoBack
    }
  };
  
  const mockAddPaymentMethod = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (usePaymentMethods as jest.Mock).mockReturnValue({
      addPaymentMethod: mockAddPaymentMethod
    });
  });

  it('renders correctly with all fields', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    expect(screen.getByText('Add Payment Method')).toBeTruthy();
    expect(screen.getByText('Card Number')).toBeTruthy();
    expect(screen.getByText('Expiry Date')).toBeTruthy();
    expect(screen.getByText('CVV')).toBeTruthy();
    expect(screen.getByText('Cardholder Name')).toBeTruthy();
    expect(screen.getByText('Your payment information is securely encrypted')).toBeTruthy();
    
    // Check buttons
    expect(screen.getByText('Add Payment Method')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('formats card number with spaces', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    
    fireEvent.changeText(cardNumberInput, '4242424242424242');
    
    expect(cardNumberInput.props.value).toBe('4242 4242 4242 4242');
  });

  it('formats expiry date with slash', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    const expiryDateInput = screen.getByPlaceholderText('MM/YY');
    
    fireEvent.changeText(expiryDateInput, '1225');
    
    expect(expiryDateInput.props.value).toBe('12/25');
  });

  it('limits CVV to 4 digits', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    const cvvInput = screen.getByPlaceholderText('123');
    
    fireEvent.changeText(cvvInput, '12345');
    
    expect(cvvInput.props.value).toBe('1234');
  });

  it('validates form before submission', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Submit with empty form
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Card Number',
      'Please enter a valid card number.',
      expect.any(Array)
    );
    expect(mockAddPaymentMethod).not.toHaveBeenCalled();
  });

  it('validates expiry date', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Fill card number
    fireEvent.changeText(screen.getByPlaceholderText('1234 5678 9012 3456'), '4242424242424242');
    
    // Fill invalid expiry date (past date)
    fireEvent.changeText(screen.getByPlaceholderText('MM/YY'), '0120');
    
    // Submit form
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Card Expired',
      'The card expiration date is in the past.',
      expect.any(Array)
    );
    expect(mockAddPaymentMethod).not.toHaveBeenCalled();
  });

  it('handles successful payment method addition', async () => {
    mockAddPaymentMethod.mockResolvedValue(true);
    
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Fill form with valid data
    fireEvent.changeText(screen.getByPlaceholderText('1234 5678 9012 3456'), '4242424242424242');
    fireEvent.changeText(screen.getByPlaceholderText('MM/YY'), '1230');
    fireEvent.changeText(screen.getByPlaceholderText('123'), '123');
    fireEvent.changeText(screen.getByPlaceholderText('John Doe'), 'John Doe');
    
    // Submit form
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    await waitFor(() => {
      expect(mockAddPaymentMethod).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Method Added',
        'Your payment method has been added successfully.',
        expect.any(Array)
      );
      expect(mockOnGoBack).toHaveBeenCalled();
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('handles payment method addition failure', async () => {
    mockAddPaymentMethod.mockRejectedValue(new Error('Failed to add payment method'));
    
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Fill form with valid data
    fireEvent.changeText(screen.getByPlaceholderText('1234 5678 9012 3456'), '4242424242424242');
    fireEvent.changeText(screen.getByPlaceholderText('MM/YY'), '1230');
    fireEvent.changeText(screen.getByPlaceholderText('123'), '123');
    fireEvent.changeText(screen.getByPlaceholderText('John Doe'), 'John Doe');
    
    // Submit form
    fireEvent.press(screen.getByText('Add Payment Method'));
    
    await waitFor(() => {
      expect(mockAddPaymentMethod).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to add payment method: Failed to add payment method',
        expect.any(Array)
      );
    });
  });

  it('handles cancel button press', () => {
    render(<AddPaymentMethodScreen navigation={mockNavigation} route={mockRoute} />);
    
    fireEvent.press(screen.getByText('Cancel'));
    
    expect(mockOnGoBack).toHaveBeenCalled();
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});