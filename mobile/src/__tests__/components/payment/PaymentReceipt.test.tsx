import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PaymentReceipt from '../../../components/payment/PaymentReceipt';

describe('PaymentReceipt', () => {
  const mockOnClose = jest.fn();
  const mockOnRateExperience = jest.fn();
  
  const defaultProps = {
    paymentId: 'pay_123456',
    requestId: 'req_123456',
    itemsCost: 25.50,
    deliveryFee: 5.00,
    tip: 2.50,
    total: 33.00,
    paymentDate: new Date('2023-01-15T14:30:00'),
    paymentMethod: {
      brand: 'visa',
      last_four: '4242'
    },
    onClose: mockOnClose,
    onRateExperience: mockOnRateExperience
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all props', () => {
    render(<PaymentReceipt {...defaultProps} />);
    
    // Check header content
    expect(screen.getByText('Payment Successful')).toBeTruthy();
    expect(screen.getByText('Thank you for your payment')).toBeTruthy();
    
    // Check payment details
    expect(screen.getByText('Payment ID:')).toBeTruthy();
    expect(screen.getByText('pay_123456')).toBeTruthy();
    expect(screen.getByText('Request ID:')).toBeTruthy();
    expect(screen.getByText('req_123456')).toBeTruthy();
    expect(screen.getByText('Date:')).toBeTruthy();
    expect(screen.getByText('Visa •••• 4242')).toBeTruthy();
    
    // Check cost breakdown
    expect(screen.getByText('Items Total')).toBeTruthy();
    expect(screen.getByText('$25.50')).toBeTruthy();
    expect(screen.getByText('Delivery Fee')).toBeTruthy();
    expect(screen.getByText('$5.00')).toBeTruthy();
    expect(screen.getByText('Tip')).toBeTruthy();
    expect(screen.getByText('$2.50')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('$33.00')).toBeTruthy();
    
    // Check buttons
    expect(screen.getByText('Rate Your Experience')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('formats currency correctly with different currency prop', () => {
    render(<PaymentReceipt {...defaultProps} currency="EUR" />);
    
    // Check currency formatting
    expect(screen.getByText('€25.50')).toBeTruthy();
    expect(screen.getByText('€5.00')).toBeTruthy();
    expect(screen.getByText('€2.50')).toBeTruthy();
    expect(screen.getByText('€33.00')).toBeTruthy();
  });

  it('calls onRateExperience when rate button is pressed', () => {
    render(<PaymentReceipt {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Rate Your Experience'));
    
    expect(mockOnRateExperience).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is pressed', () => {
    render(<PaymentReceipt {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Close'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('formats date correctly', () => {
    render(<PaymentReceipt {...defaultProps} />);
    
    // Check date formatting (exact format may vary by locale, so we check for parts)
    const dateText = screen.getByText(/January 15, 2023/);
    expect(dateText).toBeTruthy();
  });
});