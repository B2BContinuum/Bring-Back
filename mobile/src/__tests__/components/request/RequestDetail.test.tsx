import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RequestDetail from '../../../components/request/RequestDetail';
import { DeliveryRequest, RequestStatus } from '../../../../../shared/src/types';

// Mock request data
const mockRequest: DeliveryRequest = {
  id: 'request-123',
  tripId: 'trip-456',
  requesterId: 'user-789',
  items: [
    {
      id: 'item-1',
      name: 'Milk',
      description: '1 gallon',
      quantity: 1,
      estimatedPrice: 3.99
    },
    {
      id: 'item-2',
      name: 'Bread',
      description: 'Whole wheat',
      quantity: 2,
      estimatedPrice: 2.49,
      actualPrice: 2.99
    }
  ],
  deliveryAddress: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA'
  },
  maxItemBudget: 10,
  deliveryFee: 5,
  specialInstructions: 'Please leave at the door',
  status: RequestStatus.ACCEPTED,
  createdAt: new Date(),
  acceptedAt: new Date(),
};

// Mock functions
const mockOnUpdateStatus = jest.fn();
const mockOnCancel = jest.fn();
const mockOnBack = jest.fn();

describe('RequestDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with request details', () => {
    const { getByText } = render(
      <RequestDetail
        request={mockRequest}
        onBack={mockOnBack}
      />
    );

    // Check if title is displayed
    expect(getByText('Request Details')).toBeTruthy();
    
    // Check if items are displayed
    expect(getByText('Milk')).toBeTruthy();
    expect(getByText('Bread')).toBeTruthy();
    expect(getByText('1 gallon')).toBeTruthy();
    expect(getByText('Whole wheat')).toBeTruthy();
    
    // Check if address is displayed
    expect(getByText('123 Main St')).toBeTruthy();
    expect(getByText('Anytown, CA 12345')).toBeTruthy();
    expect(getByText('USA')).toBeTruthy();
    
    // Check if special instructions are displayed
    expect(getByText('Please leave at the door')).toBeTruthy();
    
    // Check if payment summary is displayed
    expect(getByText('Items (3):')).toBeTruthy();
    expect(getByText('$8.97')).toBeTruthy(); // 3.99 + (2.99 * 2) = 9.97, but we're using estimatedPrice
    expect(getByText('$5.00')).toBeTruthy();
    expect(getByText('$13.97')).toBeTruthy(); // 8.97 + 5.00
  });

  it('shows action buttons for travelers with accepted status', () => {
    const { getByText } = render(
      <RequestDetail
        request={mockRequest}
        isTraveler={true}
        onUpdateStatus={mockOnUpdateStatus}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    );

    // Cancel button should be visible
    expect(getByText('Cancel Request')).toBeTruthy();
    
    // Mark as Purchased button should be visible
    expect(getByText('Mark as Purchased')).toBeTruthy();
  });

  it('shows action buttons for travelers with purchased status', () => {
    const purchasedRequest = {
      ...mockRequest,
      status: RequestStatus.PURCHASED
    };
    
    const { getByText, queryByText } = render(
      <RequestDetail
        request={purchasedRequest}
        isTraveler={true}
        onUpdateStatus={mockOnUpdateStatus}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    );

    // Cancel button should be visible
    expect(getByText('Cancel Request')).toBeTruthy();
    
    // Mark as Delivered button should be visible
    expect(getByText('Mark as Delivered')).toBeTruthy();
  });

  it('does not show action buttons for delivered status', () => {
    const deliveredRequest = {
      ...mockRequest,
      status: RequestStatus.DELIVERED,
      completedAt: new Date()
    };
    
    const { queryByText } = render(
      <RequestDetail
        request={deliveredRequest}
        isTraveler={true}
        onUpdateStatus={mockOnUpdateStatus}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    );

    // No action buttons should be visible
    expect(queryByText('Cancel Request')).toBeNull();
    expect(queryByText('Mark as Delivered')).toBeNull();
  });

  it('calls onUpdateStatus when action button is pressed', () => {
    const { getByText } = render(
      <RequestDetail
        request={mockRequest}
        isTraveler={true}
        onUpdateStatus={mockOnUpdateStatus}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByText('Mark as Purchased'));
    expect(mockOnUpdateStatus).toHaveBeenCalledWith('request-123', RequestStatus.PURCHASED);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <RequestDetail
        request={mockRequest}
        onCancel={mockOnCancel}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByText('Cancel Request'));
    expect(mockOnCancel).toHaveBeenCalledWith('request-123');
  });

  it('calls onBack when back button is pressed', () => {
    const { getByText } = render(
      <RequestDetail
        request={mockRequest}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByText('Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});