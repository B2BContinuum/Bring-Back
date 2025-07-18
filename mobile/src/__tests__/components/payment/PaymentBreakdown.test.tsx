import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PaymentBreakdown from '../../../components/payment/PaymentBreakdown';

describe('PaymentBreakdown', () => {
  const defaultProps = {
    itemsCost: 25.50,
    deliveryFee: 5.00,
    tip: 3.00,
    total: 33.50,
    currency: 'USD'
  };

  it('renders correctly with all props', () => {
    render(<PaymentBreakdown {...defaultProps} />);
    
    // Check if all sections are rendered
    expect(screen.getByText('Payment Summary')).toBeTruthy();
    expect(screen.getByText('Items Total')).toBeTruthy();
    expect(screen.getByText('Delivery Fee')).toBeTruthy();
    expect(screen.getByText('Tip')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    
    // Check if amounts are formatted correctly
    expect(screen.getByText('$25.50')).toBeTruthy();
    expect(screen.getByText('$5.00')).toBeTruthy();
    expect(screen.getByText('$3.00')).toBeTruthy();
    expect(screen.getByText('$33.50')).toBeTruthy();
  });

  it('renders with zero values', () => {
    const zeroProps = {
      itemsCost: 0,
      deliveryFee: 0,
      tip: 0,
      total: 0
    };
    
    render(<PaymentBreakdown {...zeroProps} />);
    
    // Check if zero amounts are formatted correctly
    expect(screen.getByText('$0.00')).toBeTruthy();
  });

  it('renders with different currency', () => {
    const eurProps = {
      ...defaultProps,
      currency: 'EUR'
    };
    
    render(<PaymentBreakdown {...eurProps} />);
    
    // Check if currency symbol is changed
    expect(screen.getByText('€25.50')).toBeTruthy();
    expect(screen.getByText('€5.00')).toBeTruthy();
    expect(screen.getByText('€3.00')).toBeTruthy();
    expect(screen.getByText('€33.50')).toBeTruthy();
  });
});