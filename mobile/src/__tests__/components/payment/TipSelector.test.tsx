import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TipSelector from '../../../components/payment/TipSelector';

describe('TipSelector', () => {
  const mockOnTipChange = jest.fn();
  
  const defaultProps = {
    deliveryFee: 10.00,
    onTipChange: mockOnTipChange,
    currency: 'USD'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<TipSelector {...defaultProps} />);
    
    expect(screen.getByText('Add a Tip')).toBeTruthy();
    expect(screen.getByText('100% of your tip goes to the traveler')).toBeTruthy();
    
    // Check if percentage buttons are rendered
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    
    // Check if custom tip input is rendered
    expect(screen.getByText('Custom Tip:')).toBeTruthy();
    expect(screen.getByPlaceholderText('0.00')).toBeTruthy();
  });

  it('selects 15% tip by default', () => {
    render(<TipSelector {...defaultProps} />);
    
    // 15% of $10 is $1.50
    expect(mockOnTipChange).toHaveBeenCalledWith(1.5);
  });

  it('handles percentage selection correctly', () => {
    render(<TipSelector {...defaultProps} />);
    
    // Select 20% tip
    fireEvent.press(screen.getByText('20%'));
    
    // 20% of $10 is $2.00
    expect(mockOnTipChange).toHaveBeenCalledWith(2);
    
    // Select 0% tip
    fireEvent.press(screen.getByText('0%'));
    
    // 0% of $10 is $0.00
    expect(mockOnTipChange).toHaveBeenCalledWith(0);
  });

  it('handles custom tip input correctly', () => {
    render(<TipSelector {...defaultProps} />);
    
    const customTipInput = screen.getByPlaceholderText('0.00');
    
    // Enter custom tip of $5.00
    fireEvent.changeText(customTipInput, '5.00');
    
    expect(mockOnTipChange).toHaveBeenCalledWith(5);
  });

  it('handles invalid custom tip input', () => {
    render(<TipSelector {...defaultProps} />);
    
    const customTipInput = screen.getByPlaceholderText('0.00');
    
    // Enter invalid tip
    fireEvent.changeText(customTipInput, 'abc');
    
    // Should default to 0
    expect(mockOnTipChange).toHaveBeenCalledWith(0);
  });

  it('displays correct tip amounts based on delivery fee', () => {
    const props = {
      ...defaultProps,
      deliveryFee: 20.00
    };
    
    render(<TipSelector {...props} />);
    
    // Check if tip amounts are calculated correctly
    expect(screen.getByText('$0.00')).toBeTruthy();
    expect(screen.getByText('$2.00')).toBeTruthy(); // 10% of $20
    expect(screen.getByText('$3.00')).toBeTruthy(); // 15% of $20
    expect(screen.getByText('$4.00')).toBeTruthy(); // 20% of $20
    expect(screen.getByText('$5.00')).toBeTruthy(); // 25% of $20
  });
});